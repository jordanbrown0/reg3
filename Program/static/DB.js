// Front end for DBMS

var db = {};
var table = {};

// Create up a reference to a DB (a collection of tables).
//
// Params:
// onload:  callback function for when the DB is ready for use.
function DB(dbName, params) {
    var o = this;
    o.dbName = dbName;
    o.loaded = false;
    rpc.DBload(o.dbName, function () {
        if (params.onload) {
            params.onload();
        }
        o.loaded = true;
    });
}

DB.prototype.getName = function () {
    var o = this;
    return (o.dbName);
};

DB.prototype.listTables = function (cb) {
    var o = this;
    rpc.DBlistTables(o.dbName, cb);
};

DB.prototype.importResync = function (file, cb) {
    var o = this;
    REST.importResync(o.dbName, file, cb);
};

DB.prototype.exportResync = function (tables) {
    var o = this;
    tables = tables || null;
    REST.exportResync(o.dbName, tables);
};

// Params:
// defaults:  a prototypical record supplying defaults for any fields that
// are undefined in the DB.
// NEEDSWORK:  When we apply defaults it is in a sense a change to the record.
// Maybe applying defaults should cause the record to be written back.  On the
// other hand, as long as we apply the same defaults each time we'll get the
// same results each time, and *not* actually adding to them to the record keeps
// the size of the DB down.
function DBTable(db, tName, params) {
    var o = this;
    o.db = db;
    o.dbName = db.getName(); // Cache so we don't have to call repeatedly.
    o.tName = tName;
    o.schema = params.schema || [];
    o.defaults = Editor.defaults(o.schema);
}

// Gets the specified record.  Calls the callback with the record as an
// argument.  It is an error if the record does not exist.  Apply defaults
// from the DBTable object.
//
DBTable.prototype.get = function(k, cb) {
    var o = this;
    rpc.DBget(o.dbName, o.tName, k, function (r) {
        o.applyDefaults(r);
        cb(r);
    });
};

// Gets the specified record or, if it doesn't exist, adds it with no
// contents and returns that.
// This is primarily for the global, server, and station configuration records,
// where we want them automatically created at need and where they need fixed
// names.
//
// Alternatives:
//
// DBgetOrAdd with default: if the record doesn't exist, add it with default
// contents.  But then the new-record case is different from the new-field
// case and the caller must handle both.
//
// DBgetOrDefault:  if the record doesn't exist, returns a default
// (perhaps {}).  But then if you go to put it back with changes, you don't
// have a version vector.  OTOH, lack of a version vector is a lot like an
// empty version vector.  Still, this leaves us with a "phantom" record that we
// think exists, but really doesn't.  It would require a subsequent DBputOrAdd,
// rather than just a DBput.
//
// DBgetOrNull:  if the record doesn't exist, returns null.  But then the caller
// has to process it to notice the case and apply defaults, and if the caller
// creates it then there may be races in the get/add sequence.
//
// Net:  Best to atomically create the record, and create it empty so that the
// same logic can be used for new records and new fields.
DBTable.prototype.getOrAdd = function (k, rDef, expr, cb) {
    var o = this;
    rpc.DBgetOrAdd(o.dbName, o.tName, k, rDef, expr, function (r) {
        o.applyDefaults(r);
        cb(r);
    });
};

DBTable.prototype.getOrNull = function (k, cb) {
    var o = this;
    rpc.DBgetOrNull(o.dbName, o.tName, k, function (r) {
        if (r) {
            o.applyDefaults(r);
        }
        cb(r);
    });
};

DBTable.prototype.put = function (k, r, expr, cb) {
    var o = this;
    rpc.DBput(o.dbName, o.tName, k, r, expr, cb);
};

DBTable.prototype.update = function (k, r, expr, cb) {
    var o = this;
    rpc.DBupdate(o.dbName, o.tName, k, r, expr, cb);
};

DBTable.prototype.add = function (k, r, expr, cb) {
    var o = this;
    rpc.DBadd(o.dbName, o.tName, k, r, expr, cb);
};

DBTable.prototype.delete = function (k, r, cb) {
    var o = this;
    rpc.DBdelete(o.dbName, o.tName, k, r, cb);
};

DBTable.prototype.list = function (params, cb) {
    var o = this;
    rpc.DBlist(o.dbName, o.tName, params, function (recs) {
        recs = new ArrayObject(recs);
        recs.forEach(function (k, r) {
            o.applyDefaults(r);
        });
        cb(recs);
    });
};

DBTable.prototype.reduce = function (params, cb) {
    var o = this;
    rpc.DBreduce(o.dbName, o.tName, params, cb);
};

DBTable.prototype.inc = function (k, field, limitField, cb) {
    var o = this;
    rpc.DBinc(o.dbName, o.tName, k, field, limitField, cb);
};

DBTable.prototype.applyDefaults = function (r) {
    var o = this;
    function apply(o, def) {
        for (var f in def) {
            if (o[f] == undefined) {
                o[f] = def[f];
            } else if (def[f] instanceof Object) {
                apply(o[f], def[f]);
            }
        }
    }
    if (o.defaults) {
        apply(r, o.defaults);
    }
};

DBTable.prototype.externalImport = function (file, params, cb) {
    var o = this;
    REST.import(file, o.dbName, o.tName, params, cb);
};

DBTable.prototype.externalExport = function (params, cb) {
    var o = this;
    REST.export(o.dbName, o.tName, params);
    // NEEDSWORK it would be better if we could detect when the export
    // completes.
    cb();
};

DBTable.prototype.zap = function  (cb) {
    var o = this;
    rpc.DBzap(o.dbName, o.tName, cb);
};

DBTable.prototype.fieldNames = function () {
    var o = this;
    var schema = Editor.getSchema(o.tName, o.schema);
    return (Editor.fieldNames(schema));
};
