import Parser from 'stream-json/Parser.js';
import Chain from 'stream-chain';
import StreamValues from 'stream-json/streamers/StreamValues.js';
import fs from 'fs';
import { Version } from './version.js';
import { Expression } from './Expression.js';
import { assert, log, unreachable } from './utils.js';
import Concurrency from './Concurrency.js';
import { Debug } from './Debug.js';

// NEEDSWORK the "data/" should probably be specified by the caller,
// probably in the form of a parameter on a (hypothetical future) DBMS object.
function DB(name) {
    var o = this;
    o.name = name;
    o.filename = 'data/'+name + '.json';
    o.syncFlag = true;
    o.tables = {};
}

DB.prototype.getName = function () {
    var o = this;
    return (o.name);
};

// NEEDSWORK:  this should be single-threaded.
DB.prototype.load = async function() {
    var o = this;
    var t0 = Date.now();
    var nrecs = 0;
    log('starting load', o.name);
    assert(!o.loadInProgress, 'DB.load entered reentrantly!');
    o.loadInProgress = true;
    var pipeline = new Chain([
        fs.createReadStream(o.filename),
        new Parser({jsonStreaming:true}),
        new StreamValues()
    ]);
    pipeline.on('data', function (d) {
        var t = o.getTable(d.value.t);
        t.load(d.value.k, d.value.r);
        nrecs++;
    });

    return (new Promise(function (resolve, reject) {
        pipeline.on('end', function () {
            o.loadInProgress = false;
            pipeline.destroy();
            log('finished load',
                o.name,
                nrecs, 'records took',
                (Date.now()-t0)+'ms'
            );
            resolve();
        });
        // Ignore ENOENT so that nonexistent
        // databases are effectively empty.
        pipeline.on('error',  function (e) {
            o.loadInProgress = false;
            pipeline.destroy();
            if (e.code == 'ENOENT') {
                log('nonexistent', o.name);
                resolve();
            } else {
                log('load error', o.name);
                reject(e);
            }
        });
    }));
};

// NEEDSWORK:  Should this be single-threaded?
DB.prototype.importResync = async function(stream) {
    var o = this;
    var t0 = Date.now();
    var nrec = 0;

    var conflicts = [];
    var pipeline = new Chain([
        stream,
        new Parser({jsonStreaming:true}),
        new StreamValues()
    ]);
    pipeline.on('data', function (d) {
        nrec++;
        var t = o.getTable(d.value.t);
        var result = t.importResync(d.value.k, d.value.r);
        if (result) {
            conflicts.push(result);
        }
    });

    return (new Promise(function (resolve, reject) {
        pipeline.on('end', function () {
            o.write();
            log('finished import',
                nrec, 'records',
                conflicts.length, 'conflicts',
                (Date.now()-t0)+'ms'
            );
            resolve(conflicts);
        });
        // Report errors and then ignore them.
        // NEEDSWORK:  this error catch may be broader than
        // is desirable; it will presumably cause corrupt
        // files to be effectively truncated rather than
        // reported.
        pipeline.on('error', function (e) {
            log('import pipeline error');
            log(e);
            resolve();
        });
    }));
};

DB.prototype.getTable = function (name) {
    var o = this;
    var t = o.tables[name];
    if (!t) {
        t = new Table(o, name);
        o.tables[name] = t;
    }
    return (t);
};

DB.prototype.sync = function (b) {
    var o = this;
    o.syncFlag = b;
    if (o.syncFlag) {
        o.write();
    }
};

// NEEDSWORK should perhaps be async function.  Or perhaps should even be
// on a timer rather than sync with the RPC request.  This is less of an issue
// with the move to incremental write for most cases.
DB.prototype.write = function() {
    var o = this;

    if (!o.syncFlag) {
        return;
    }

    var t0 = Date.now();
    var nrec = 0;
    var fd = fs.openSync(o.filename+'.new', 'w', 0o600);
    for (var tName in o.tables) {
        var t = o.tables[tName];
        t.forEach(function (k, r) {
            var rec = {
                t: tName,
                k: k,
                r: r
            };
            fs.writeSync(fd, JSON.stringify(rec));
            fs.writeSync(fd, '\n');
            nrec++;
        });
    }
    fs.closeSync(fd);
    fs.renameSync(o.filename+'.new', o.filename);
    log('wrote',o.name,nrec,'records took', (Date.now()-t0)+'ms');
};

DB.prototype.writeStream = function (stream, tables) {
    var o = this;
    var t0 = Date.now();
    var nrecs = 0;

    if (!tables) {
        tables = Object.keys(o.tables);
    }
    tables.forEach(function (tName) {
        var t = o.tables[tName];
        t.forEach(function (k, r) {
            nrecs++;
            var rec = { t: tName, k: k, r: r };
            stream.write(JSON.stringify(rec));
            stream.write('\n');
        });
    });
    log('export finished', nrecs, 'records took', (Date.now()-t0)+'ms');
};

DB.prototype.writeRec = function (tName, k, r) {
    var o = this;
    var t0 = Date.now();
    var fd = fs.openSync(o.filename, 'a', 0o600);
    var rec = {
        t: tName,
        k: k,
        r: r
    };
    fs.writeSync(fd, JSON.stringify(rec));
    fs.writeSync(fd, '\n');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    log('wrote',o.name,'record took', (Date.now()-t0)+'ms');
};

DB.prototype.listTables = function () {
    var o = this;
    var ret = {};
    for (var tName in o.tables) {
        var t = o.tables[tName];
        ret[tName] = { version: t.version };
    }
    return (ret);
};

function Table(db, name) {
    var o = this;
    o.db = db;
    o.name = name;
    o.records = {};
    o.serial = 0;
    o.syncFlag = true;
    o.cachedSort = null;
    o.version = 0;
}

Table.prototype.getDBName = function () {
    var o = this;
    return (o.db.getName());
};

Table.prototype.getName = function () {
    var o = this;
    return (o.name);
};

// NEEDSWORK perhaps we should intern the field names to reduce memory
// consumption.  It would make load a little slower, though, because we'd
// have to recreate all of the records instead of using the ones that
// the JSON parser created.
Table.prototype.load = function (k, r) {
    var o = this;
    o.records[k] = r;
    // NEEDSWORK note that this causes a server to use serial numbers
    // starting at the largest serial number used on this table on any
    // server.  (But multiple servers might still allocate the same
    // serial number.) That's not bad, but it's a little weird.
    // NEEDSWORK perhaps record keys should be DB-unique, not merely
    // table-unique.  Not sure why, though.
    var serial = parseInt(k.split('-').pop(), 10);
    if (serial > o.serial) {
        o.serial = serial;
    }
};

Table.prototype.sync = function (b) {
    var o = this;
    o.syncFlag = b;
    if (o.syncFlag) {
        o.write();
    }
};

Table.prototype.write = function () {
    var o = this;
    o.version++;
    if (!o.syncFlag) {
        return;
    }
    o.db.write();
};

Table.prototype.writeRec = function (k) {
    var o = this;
    o.version++;
    if (!o.syncFlag) {
        return;
    }
    o.db.writeRec(o.name, k, o.records[k]);
};

Table.prototype.forEach = function (cb) {
    var o = this;
    for (var k in o.records) {
        cb(k, o.records[k]);
    }
};

Table.prototype.forEachAsync = async function (cb) {
    var o = this;
    for (var k in o.records) {
        await cb(k, o.records[k]);
    }
};

Table.prototype.check_exists = function(k) {
    var o = this;
    var r = o.records[k];
    if (!r || r._deleted) {
        throw new Error('no such record - '
            + [ o.db.name, o.name, k ].join(' / '));
    }
};

Table.prototype.list = function (params) {
    var o = this;
    if (!params) {
        params = {};
    }
    var filter = params.filter && new Expression(params.filter);
    var ret = [];
    var n = 0;
    function doRec(k) {
        var r = o.records[k];
        if (r._deleted) {
            return (true);
        }
        if (filter && !filter.exec(r)) {
            return (true);
        }
        var tmp = {};
        tmp[k] = r;
        ret.push(tmp);
        n++;
        if (params.limit && n >= params.limit) {
            return (false);
        }
        return (true);
    }
    // Compare records according to the configured sort.
    // The undefined and null values are considered to equal to each other,
    // and to be greater than any other value.
    function compareRecs(a, b) {
        var ar = o.records[a];
        var br = o.records[b];
        for (var i = 0; i < params.sort.length; i++) {
            var f = params.sort[i];
            var af = ar[f];
            var bf = br[f];
            if (af == undefined) {
                if (bf != undefined) {
                    return (1);
                }
            } else if (bf == undefined) {
                return (-1);
            } else if (af < bf) {
                return (-1);
            } else if (af > bf) {
                return (1);
            }
        }
        return (0);
    }
    function sameSort(fields, cached) {
        if (!cached) {
            return (false);
        }
        if (fields.length != cached.fields.length) {
            return (false);
        }
        for (var i = 0; i < fields.length; i++) {
            if (fields[i] != cached.fields[i]) {
                return (false);
            }
        }
        return (true);
    }
    if (params.sort) {
        var keys;
        if (sameSort(params.sort, o.cachedSort)) {
            keys = o.cachedSort.keys;
        } else {
            keys = Object.keys(o.records)
            keys = keys.sort(compareRecs);
            o.cachedSort = {
                fields: params.sort,
                keys: keys
            };
        }
        for (var i = 0; i < keys.length; i++) {
            if (!doRec(keys[i])) {
                break;
            }
        }
    } else {
        for (var k in o.records) {
            if (!doRec(k)) {
                break;
            }
        }
    }
    return (ret);
};

Table.prototype.reduce = function (params) {
    var o = this;
    var dirty = false;
    if (!params) {
        params = {};
    }
    var expr = new Expression(params.expr, {init: params.init});
    function doRec(k) {
        var r = o.records[k];
        if (r._deleted) {
            return (true);
        }
        expr.exec(r);
        if (r._dirty) {
            delete r._dirty;
            dirty = true;
            o.bump(r);
        }
        return (true);
    }
    for (var k in o.records) {
        if (!doRec(k)) {
            break;
        }
    }
    if (dirty) {
        o.write();
    }
    return (expr.getVariables());
};

Table.prototype.get = function(k) {
    var o = this;
    o.check_exists(k);
    return (o.records[k]);
};

// Get the specified record, or add it as a new empty record.
//
// In a sense, this means that nonexistent records appear to be empty when
// accessed.
//
// If the specified record exists and is not deleted, return it.
// If it does not exist or is deleted, add it as an empty record and return
// that.
//
// If adding a record, execute the expression on the new record.
Table.prototype.getOrAdd = function(k, rDef, expr) {
    var o = this;
    var r = o.records[k];
    if (r && !r._deleted) {
        return (r);
    } else {
        o.add(k, rDef, expr);
        return (o.records[k]);
    }
};

Table.prototype.getOrNull = function(k) {
    var o = this;
    var r = o.records[k];
    if (r && !r._deleted) {
        return (r);
    } else {
        return (null);
    }
};

// Delete the specified record.
//
// Caller must include the current version of the record, so that we won't
// delete a record if it's been changed by somebody else.
//
// Of course, we cannot *actually* delete the record, because then we couldn't
// replicate the deletion.  We empty it out, mark it deleted, and leave it as
// a tombstone.
Table.prototype.delete = function(k, r) {
    var o = this;
    // Rather than deleting away all of the fields, just replace it with
    // a deleted record with the right version.
    r = { _version: r._version, _deleted: true };
    return (o.put(k, r, null));
};

// Replace the specified record with the specified contents.
// Note:  the record supplied is *not* copied; it *is* the in-memory record.
// Caller must not access it after the put.
// Execute expr, if provided, on the record before storing it.
// On conflict, return a conflict record for client-side resolution.
// Note that the expression is evaluated *before* checking for a conflict,
// so the conflict record reflects any changes made by the expression.
// This allows the conflict resolver to be table-independent, but also
// means that the expression must not have effects outside this table.
Table.prototype.put = function(k, r, expr) {
    var o = this;
    o.check_exists(k);

    if (expr) {
        (new Expression(expr)).exec(r);
    }

    var rExist = o.records[k];
    // Note that the comparison rules here are different from the rules in
    // importResync().  There, the version vectors accurately reflect the
    // changes in the records, and all four combinations are valid.
    // Here, the caller has updated the record but has *not* bumped the
    // version.  They were starting with a record from this server, so there
    // should be no way that the new edition of the record is, version-wise,
    // newer than the existing record.
    switch (Version.compare(r._version, rExist._version)) {
    case 0: // Equal - normal case
    case 1: // Candidate is newer (import resolve only)
        o.bump(r);
        o.records[k] = r;
        o.writeRec(k);
        o.cachedSort = null;
        return (null);
    case 2: // Existing is newer - somebody else has updated the record.
    case 3: // Conflict (import resolve with additional conflict)
        Debug.version('conflict', o.name, k);
        return o.conflict(k, rExist, r);
    }
    unreachable();
};

Table.prototype.conflict = function (k, rExist, rImport) {
    var o = this;
    return ({
        t: o.name,
        k: k,
        existing: rExist,
        import: rImport,
        result: {
            _version:
                Version.merge(rExist._version, rImport._version)
        }
    });
};

// Returns the specified field and, if it's within limits, returns the current
// value and increments the value in the table.
//
// This is not quite as good as a field that's automatically filled in
// on add, because in theory a client could pull a number here and then
// fail to add it to a record, but mostly "who cares?".
Table.prototype.inc = function (k, field, limitField) {
    var o = this;
    o.check_exists(k);
    var r = o.records[k];
    if (!r[field] || r[field] > r[limitField]) {
        return (null);
    }
    var ret = r[field];
    r[field]++;
    o.bump(r);
    o.writeRec(k);
    o.cachedSort = null;
    return (ret);
};

// Adds a new record.
//
// If a key is specified and there isn't already a record using that key,
// uses it; else, allocates a new key.
//
// Note that we are willing to revive a deleted record ID.
// In that case, we continue to use the same version vector.

Table.prototype.add = function (k, r, expr) {
    var o = this;
    var rOld;

    r._version = {};
    if (k == null) {
        o.serial++;
        k = serverID + '-' + o.serial;
        assert(!o.records[k], 'automatically allocated record id reused!');
    } else if (rOld = o.records[k]) {
        if (!rOld._deleted) {
            throw new Error('record already exists - '
                [ o.db.name, o.name, k ].join(' / '));
        }
        r._version = rOld._version;
    }
    if (expr) {
        (new Expression(expr)).exec(r);
        delete r._dirty;
    }
    o.bump(r);
    o.records[k] = r;
    o.writeRec(k);
    o.cachedSort = null;
    return (k);
};

// Increment the version vector on the specified record.
Table.prototype.bump = function (r) {
    var o = this;
    Version.bump(r._version, serverID);
    Debug.version('bump', serverID, 'to', r._version);
};

//
// Import a record into the table, returning information about conflicts.
// If the record is new, add it and return null.
// If the record is the same as the existing one, do nothing and return null.
// If the record is older than the existing one, do nothing and return null.
// If the record is newer than the existing one, replace the existing one
// and return null.
// If the record conflicts with the existing one, return a conflict object:
//     t:  table name
//     k:  record key
//     existing:  existing record
//     import:  record to be imported
//     result:  blank (but appropriately versioned) record that the caller
//         should fill in with the results of the merge, then put.
//
Table.prototype.importResync = function (k, rImport) {
    var o = this;
    var rExist = o.records[k];
    if (rExist) {
        switch (Version.compare(rExist._version, rImport._version)) {
        case 0: // Equal
            Debug.version('equal', o.name, k);
            return (null);
        case 1: // Existing is newer
            Debug.version('existing is newer', o.name, k);
            return (null);
        case 2: // Import is newer
            o.records[k] = rImport;
            Debug.version('updated', o.name, k);
            return (null);
        case 3: // Conflict
            Debug.version('conflict', o.name, k);
            return (o.conflict(k, rExist, rImport));
        }
    } else {
        Debug.version('created', o.name, k);
        o.records[k] = rImport;
        return (null);
    }
};

Table.prototype.zap = function () {
    var o = this;
    o.records = {};
    o.cachedSort = null;
    o.write();
};

var databases = {};
var DBMS = {};

// Given a database name, return the DB object.
DBMS.getDB = async function (name) {
    var db = databases[name];
    if (!db) {
        db = new DB(name);
        databases[name] = db;
        db.once = new Concurrency.Once();
        await db.once.do(async function () {
            await db.load();
        });
    } else {
        await db.once.wait();
    }
    assert(!db.loadInProgress, 'still loading!');
    return (db);
};

DBMS.getTable = async function (dbName, tName) {
    var db = await DBMS.getDB(dbName);
    var t = db.getTable(tName);
    return (t);
};

var serverID = undefined;

// NEEDSWORK
//
// Perhaps this should be executed on the mainline during load, so that it
// is invisible to the callers.  But note that that would require a mechanism
// that ensures that subsequent operations wait for this one to complete.
// (Note that we need a similar mechanism for db.load().)
//
// Or perhaps DBMS should be an object, with this being executed as part of
// DBMS's constructor or an initializer method.  That would allow for having
// multiple DBMS instances in different directories.
//
// But for now the easy thing is to let the mainline call this and use .then()
// for sequencing.
DBMS.init = async function () {
    if (serverID) {
        return;
    }
    var dbname = 'serverID';
    var tname = 'serverID';
    var rkey = 'serverID';
    var db = await DBMS.getDB(dbname);
    var t = db.getTable(tname);
    // OCD:  We don't use getOrAdd here, because the Add part would happen
    // before we've established a server ID, and so we would end up with a VV
    // with an "undefined:xxx" entry in it.  We also bump and write it twice
    // (once for the add and once for the put).
    // OCD:  If the record exists, it should have an id.  But just in case,
    // if it doesn't then we'll just add it.
    var r = t.getOrNull(rkey);
    if (r && r.id) {
        serverID = r.id;
    } else {
        serverID = Date.now().toString();
        if (r) {
            r.id = serverID;
            t.put(rkey, r, null);
        } else {
            t.add(rkey, { id: serverID }, null);
        }
    }
    log('Server ID', serverID);
};

DBMS.getServerID = function () {
    return (serverID);
};

export { DBMS };
