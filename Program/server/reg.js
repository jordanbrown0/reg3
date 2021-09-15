// Catch unhandled errors really early, to cover all cases.

// This snippet can be helpful to find the names of events emitted by process.
// var pemit = process.emit;
// process.emit = function () {
    // console.log('process', arguments);
    // return pemit.apply(this, arguments);
// }
process.on('unhandledRejection', function (reason, promise) {
    console.log('uncaughtRejection');
    console.log(reason);
    console.log(promise);
    process.exit(1);
});
process.on('uncaughtException', function (err, origin) {
    if (origin == 'uncaughtException'
        && err.code == 'EADDRINUSE'
        && err.syscall == 'listen') {
        console.log('A server is already running on port ' + err.port + '.');
        process.exit(1);
    } else {
        console.log(err.stack);
        process.exit(1);
    }
});

const port = 80;
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
// const bodyParser = require('body-parser');
const DBMS = require('./DBMS');
const DBF = require('./DBFstream');
const CSV = require('./CSV');
const label = require('myclinic-drawer-printer').api;
const sprintf = require('sprintf-js').sprintf;
const Expression = require('./Expression');
const { assert } = require('./utils');
const multer = require('multer');
const upload = multer({ dest: 'Temp/' });
const fs = require('fs');

// NEEDSWORK:  general trace mechanism (controlled from client UI?)
var rpcVerbose = 0;
var showBusy = true;

var methods = {};

methods.methods = function () {
    return (Object.keys(methods));
};

methods.log = function () {
    console.log.apply(null, arguments);
};
methods.log.varargs = true;

// Load the specified database.
// This is not strictly necessary, because the database is lazy-loaded
// whenever referenced.  However, it allows you to move the performance
// hit to a UI-convenient place.
methods.DBload = async function (dbName) {
    await DBMS.getDB(dbName);
};

methods.DBadd = async function (dbName, tName, k, r, expr) {
    return ((await DBMS.getTable(dbName, tName)).add(k, r, expr));
};

methods.DBlist = async function (dbName, tName, params) {
    return ((await DBMS.getTable(dbName, tName)).list(params));
}

methods.DBreduce = async function (dbName, tName, params) {
    return ((await DBMS.getTable(dbName, tName)).reduce(params));
}

methods.DBget = async function(dbName, tName, k) {
    return ((await DBMS.getTable(dbName, tName)).get(k));
};

methods.DBgetOrAdd = async function(dbName, tName, k, rDef, expr) {
    return ((await DBMS.getTable(dbName, tName)).getOrAdd(k, rDef, expr));
};

methods.DBgetOrNull = async function(dbName, tName, k) {
    return ((await DBMS.getTable(dbName, tName)).getOrNull(k));
};

methods.DBput = async function (dbName, tName, k, r, expr) {
    return ((await DBMS.getTable(dbName, tName)).put(k, r, expr));
};

methods.DBdelete = async function (dbName, tName, k, r) {
    return ((await DBMS.getTable(dbName, tName)).delete(k, r));
};

methods.DBzap = async function (dbName, tName) {
    return ((await DBMS.getTable(dbName, tName)).zap());
};

methods.DBinc = async function (dbName, tName, k, field, limitField) {
    return ((await DBMS.getTable(dbName, tName)).inc(k, field, limitField));
};

methods.DBlistTables = async function (dbName) {
    return ((await DBMS.getDB(dbName)).listTables());
};

methods.importDBF = async function (file, dbName, tName, map) {
    var t = await DBMS.getTable(dbName, tName);
    var t0 = Date.now();
    var n = 0;
    var dbf = new DBF(file.path, {map: map});
    t.sync(false);
    await dbf.all(function (r) {
        if (r._deleted) {
            // NEEDSWORK:  dBASE deleted records have data preserved.
            // Our deleted records do not; they are only a tombstone.
            // Adding a deleted record with data would be a violation of the
            // definition.
            // Adding a tombstone would be pointless because this is a new
            // record, from our DBMS's point of view.
            // We'll just ignore dBASE deleted records for now.
            // Is that the best answer? Issue #179.
            return;
        }
        delete r._deleted;
        t.add(null, r, null);
        n++;
    });
    await dbf.close();
    t.sync(true);
    console.log('imported',n,'records from', file.originalname,
        'took', Date.now()-t0, 'ms');
};
methods.importDBF.file = true;

methods.importCSV = async function (file, dbName, tName, map, headers) {
    var t = await DBMS.getTable(dbName, tName);
    var t0 = Date.now();
    var n = 0;
    var csv = new CSV(file.path, {map: map, headers: headers});
    t.sync(false);
    await csv.all(function (r) {
        t.add(null, r, null);
        n++;
    });
    t.sync(true);
    console.log('imported',n,'records from', file.originalname,
        'took', Date.now()-t0, 'ms');
};
methods.importCSV.file = true;

methods.defaultServerName = function () {
    return (global.process.env.COMPUTERNAME + ' ' + global.process.cwd());
};

methods.nop = function () {
    return ('Bored now');
};

methods.eval = function (r, expr) {
    return ((new Expression(expr)).exec(r));
};

methods.label_getDeviceCaps = function (p) {
    var hdc = label.createDc2({device: p});
    var dpi = label.getDpiOfHdc(hdc);
    label.deleteDc(hdc);
    return (dpi);
};

methods.label_measureText = function (p, fontname, fontsize, s) {
    var hdc = label.createDc2({device: p});
    label.selectObject(hdc, getFont(fontname, fontsize));
    var ret = label.measureText(hdc, s);
    label.deleteDc(hdc);
    return (ret);
};

var fonts = {};
function getFont(fontname, fontsize) {
    if (!fonts[fontname]) {
        fonts[fontname] = {}
    }
    if (!fonts[fontname][fontsize]) {
        fonts[fontname][fontsize] = label.createFont(fontname, fontsize);
    }
    return (fonts[fontname][fontsize]);
}

methods.label_print = function (p, a) {
    var hdc = label.createDc2({device: p});
    label.setBkMode(hdc, label.bkModeTransparent);
    label.beginPrint(hdc);
    label.startPage(hdc);
    var font = 'Helvetica';
    var size = 18;

    a.forEach(function (e) {
        if (e.font) {
            font = e.font;
        }
        if (e.size) {
            size = Math.round(e.size);
        }

        if (e.text != null) {
            var align = label.TA_BOTTOM;
            switch (e.halign) {
            case 'left':
            default:
                align += label.TA_LEFT;
                break;
            case 'right':
                align += label.TA_RIGHT;
                break;
            case 'center':
                align += label.TA_CENTER;
                break;
            }
            label.setTextAlign(hdc, align);
            label.selectObject(hdc, getFont(font, size));
            label.textOut(hdc, Math.round(e.x), Math.round(e.y),
                e.text.toString());
        }
    });

    label.endPage(hdc);
    label.endPrint(hdc);
    label.deleteDc(hdc);
};

methods.printers = function () {
    var flag = label.PRINTER_ENUM_LOCAL;
    return (label.enumPrinters(flag, null, 4));
};

methods.getServerID = async function () {
    return (await DBMS.getServerID());
};

methods.importResync = async function (file, dbName) {
    var db = await DBMS.getDB(dbName);
    return (await db.importResync(fs.createReadStream(file.path)));
};
methods.importResync.file = true;

async function methodCallMiddleware(req, res, next)
{
    await busyCall(async function () {
        var body = req.body;
        switch(rpcVerbose) {
        case 1:
            console.log('<==', body.name);
            break;
        case 2:
            console.log('<==', body);
            if (req.file) {
                console.log('<==', req.file.path);
            }
            break;
        }

        var ret = await methodCall(body, req.file);
        
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        switch (rpcVerbose) {
        case 2:
            console.log('==>', ret);
            break;
        }

        res.json(ret);
    });
}

// This function accepts a multipart JSON-RPC request,
// perhaps including a file, and returns a JSON-RPC response.
async function multiMiddleware(req, res, next) {
    req.body = JSON.parse(req.body.request);
    next();
}

// This function accepts a file and params, and returns a JSON-RPC response.
async function methodCall(body, file) {
    assert(body.name, 'No body.name');
    assert(body.params, 'No body.params');
    var method = methods[body.name];
    if (!method) {
        return ({error: 'No such method '+body.name});
    }
    if (method.file && !file) {
        return ({error: 'no file supplied'});
    }
    if (file && !method.file) {
        return ({error: 'unwanted file supplied'});
    }
    var params = body.params;
    if (file) {
        params.unshift(file);
    }
    if (method.length != params.length && !method.varargs) {
        var msg = sprintf("%s: argument mismatch, expected %d got %d",
            body.name, method.length, params.length);
        console.log(msg);
        return ({ error: msg });
    }
    var retval;
    try {
        retval = await method.apply(null, params);
    } catch (e) {
        // This is a programmer error.
        // It would be good if we could *both* return an error *and*
        // dump one on the Node.js console.
        // Maybe we should have two exception classes, one for
        // server-side programmer errors and one for caller errors.
        console.log(e);
        return ({ error: e.toString() });
    }
    if (retval === undefined) {
        return ({});
    }
    return ({ response: retval });
}

// These methods accept a result object (a subclass of a writable stream)
// and an argument list from the caller, and must emit an appropriate file
// onto the stream.
var restExportMethods = {};

restExportMethods.exportResync = async function (res, dbName, tables) {
    assert(dbName, 'No dbName');
    res.attachment(dbName+'.json');
    var db = await DBMS.getDB(dbName);
    db.writeStream(res, tables);
};

// This middleware accepts a JSON-RPC request as a form parameter, and returns
// a file.
async function exportMiddleware(req, res, next) {
    await busyCall(async function () {
        var body = JSON.parse(req.body['request']);
        switch(rpcVerbose) {
        case 1:
            console.log('<==', body.name);
            break;
        case 2:
            console.log('<==', body);
            break;
        }
        await exportMethodCall(body, res);
        switch (rpcVerbose) {
        case 2:
            console.log('==> file');
            break;
        }
    });
}

async function exportMethodCall(req, res) {
    assert(req.name, 'No req.name');
    assert(req.params, 'No req.params');
    var method = restExportMethods[req.name];
    if (!method) {
        console.log('No such method '+req.name);
        return;
    }
    var params = req.params;
    // Note that we will prepend "res" to the method parameter list.
    var expected = method.length - 1;
    if (expected != params.length && !method.varargs) {
        var msg = sprintf("%s: argument mismatch, expected %d got %d",
            req.name, expected, params.length);
        console.log(msg);
        return;
    }
    params.unshift(res);
    try {
        await method.apply(null, params);
    } catch (e) {
        // This is a programmer error.
        // It would be good if we could *both* return an error *and*
        // dump one on the Node.js console.
        // Maybe we should have two exception classes, one for
        // server-side programmer errors and one for caller errors.
        console.log(e);
        // NEEDSWORK there's no clear way to return an error.
        // Perhaps we can return an HTTP error.
        return;
    }
    res.end();
}

var totalIdle = 0;
var totalBusy = 0;
var tPrev = null;

async function busyCall(f) {
    var tStart = hrtime();

    await f();

    var tEnd = hrtime();
    if (tPrev) {
        var idle = tStart - tPrev;
        var busy = tEnd - tStart;
        totalIdle += idle;
        totalBusy += busy;
    }
    tPrev = tEnd;
}

var avgBusy = 0;
var busyTick = 1000;    // ms

function tick() {
    const alpha = 0.2;
    var newBusy = totalBusy / (busyTick*1000*1000);
    totalBusy = 0;
    totalIdle = 0;
    avgBusy += alpha*(newBusy-avgBusy);
    if (showBusy) {
        process.stdout.write(
            sprintf("\r%5.1f%% busy %4.0fM",
                avgBusy*100,
                global.process.memoryUsage().rss/1024/1024
            )
        );
    }
}

// The .unref() keeps this from keeping the process alive.
setInterval(tick, busyTick).unref();

process.title = 'Registration Server';

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);
var count = 0;
process.stdin.on('data', function (c) {
    console.log('');
    console.log('');
    switch (c) {
    case '\3':
        process.exit();
        break;
    case 'q':
        process.exit();
        break;
    case 'r':
        rpcVerbose = (rpcVerbose+1) %3;
        var rpcmsgs = [
            'Not tracing RPC',
            'RPC method names only',
            'Full RPC tracing'
        ];
        console.log(rpcmsgs[rpcVerbose]);
        break;
    case 'b':
        showBusy = !showBusy;
        console.log(showBusy
            ? 'Showing busy percentage / memory usage'
            : 'Not showing busy percentage / memory usage');
        break;
    case 'e':
        var exprTrace = !Expression.trace();
        Expression.trace(exprTrace);
        console.log(exprTrace
            ? 'Tracing expressions'
            : 'Not tracing expressions');
        break;
    case '?':
        console.log('q - quit');
        console.log('r - toggle RPC tracing');
        console.log('e - toggle expression tracing');
        console.log('b - toggle busy/memory monitor');
        break;
    default:
        console.log('Huh?  Press ? for a list of commands.');
        break;
    }
    console.log('');
});

DBMS.init().then(function () {
    app.route('/Call')
        .put(express.json())
        .put(methodCallMiddleware);
    app.route('/CallMulti')
        .put(upload.single('file'), multiMiddleware)
        .put(methodCallMiddleware);
    app.route('/REST')
        .post(express.urlencoded({extended: true}))
        .post(exportMiddleware);
    app.use(cookieParser());
    app.use(assignCookie);
    app.use(express.static('./static'));

    app.listen(port, function () {
      console.log('Registration listening on port '+port+'!')
    });
});

function assignCookie(req, res, next) {
    const cookie = 'StationID';
    if (!req.cookies || !req.cookies[cookie]) {
        var newCookie = Date.now();
        res.cookie(cookie, newCookie, { maxAge: 20*365*24*60*60*1000 });
    }
    next();
}

function hrtime() {
    var t = process.hrtime();
    return (t[0]*1000000000+t[1]);
}