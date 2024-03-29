import { assert, log, status, UserError, cache }  from './utils.js';

// Catch unhandled errors really early, to cover all cases.

// This snippet can be helpful to find the names of events emitted by process.
// var pemit = process.emit;
// process.emit = function () {
    // log('process', arguments);
    // return pemit.apply(this, arguments);
// }
process.on('unhandledRejection', function (reason, promise) {
    log('uncaughtRejection');
    log(reason);
    log(promise);
    process.exit(1);
});
process.on('uncaughtException', function (err, origin) {
    if (origin == 'uncaughtException'
        && err.code == 'EADDRINUSE'
        && err.syscall == 'listen') {
        log('A server is already running on port ' + err.port + '.');
        process.exit(1);
    } else {
        log(err.stack);
        process.exit(1);
    }
});

import { Release } from '../ReleaseInfo/Release.js';
log('Reg3 server - Release ' + Release.name);

const port = 80;
import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();
import { Debug, debugKey } from './Debug.js';
import { DBMS } from './DBMS.js';
import { api as label } from 'myclinic-drawer-printer';
import { sprintf } from 'sprintf-js';
import { Expression } from './Expression.js';
import multer from 'multer';
const upload = multer({ dest: 'Temp/' });
import fs from 'fs';
import { Import } from './Import.js';
import { Export } from './Export.js';

var methods = {};

methods.methods = function () {
    return (Object.keys(methods));
};

methods.log = function () {
    log.apply(null, arguments);
};
methods.log.varargs = true;

// Load the specified database.
// This is not strictly necessary, because the database is lazy-loaded
// whenever referenced.  However, it allows you to move the performance
// hit to a UI-convenient place.
methods.DBload = async function (dbName) {
    await DBMS.getDB(dbName);
};

methods.DBadd = async function (dbName, tName, k, rNew, expr) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.add(k, rNew, Expression.function(expr)));
};

methods.DBlist = async function (dbName, tName, params) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.list(params, Expression.function(params.filter)));
}

methods.DBreduce = async function (dbName, tName, params) {
    var t = await DBMS.getTable(dbName, tName);
    var expr = new Expression(params.expr, {init: params.init});
    function f(r) {
        expr.setDirty(false);
        expr.exec(r);
        return (expr.getDirty());
    }
    t.reduce(params, f);
    return (expr.getVariables());
}

methods.DBget = async function(dbName, tName, k) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.get(k));
};

methods.DBgetOrAdd = async function(dbName, tName, k, rDef, expr) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.getOrAdd(k, rDef, Expression.function(expr)));
};

methods.DBgetOrNull = async function(dbName, tName, k) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.getOrNull(k));
};

// Execute expr, if provided, on the record before storing it.
// Note that the expression is evaluated *before* checking for a conflict,
// so the conflict record reflects any changes made by the expression.
// This allows the conflict resolver to be table-independent, but also
// means that the expression must not have effects outside this table.
methods.DBput = async function (dbName, tName, k, r, expr) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.put(k, r, Expression.function(expr)));
};

methods.DBupdate = async function (dbName, tName, k, r, expr) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.update(k, r, Expression.function(expr)));
};

methods.DBdelete = async function (dbName, tName, k, r) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.delete(k, r));
};

methods.DBzap = async function (dbName, tName) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.zap());
};

methods.DBinc = async function (dbName, tName, k, field, limitField) {
    var t = await DBMS.getTable(dbName, tName);
    return (t.inc(k, field, limitField));
};

methods.DBlistTables = async function (dbName) {
    var db = await DBMS.getDB(dbName);
    return (db.listTables());
};

methods.import = async function (file, dbName, tName, params) {
    let t = await DBMS.getTable(dbName, tName);
    return (Import.import(file, t, params));
};
methods.import.file = true;

methods.importConverter = function (converter, value) {
    var f = Import.converters[converter];
    assert(f, 'bad converter ' + converter);
    return (f(value));
};

methods.nop = function () {
    return ('Bored now');
};

methods.eval = function (r, expr) {
    return ((new Expression(expr)).exec(r));
};

methods.label_getDeviceCaps = function (p) {
    var hdc = label.createDc2(p, {dmOrientation: label.DMORIENT_LANDSCAPE});
    var dpi = label.getDpiOfHdc(hdc);
    label.deleteDc(hdc);
    return (dpi);
};

methods.label_measureText = function (p, fontname, fontsize, weight, s) {
    var hdc = label.createDc2(p);
    label.selectObject(hdc, getFont(fontname, fontsize, weight));
    var ret = label.measureText(hdc, s);
    label.deleteDc(hdc);
    return (ret);
};

methods.release = function () {
    return Release;
};

methods.enumFonts = function () {
    return (label.enumFonts());
}

var fonts = {};
function getFont(fontname, fontsize, weight) {
    function create() {
        if (!(weight in fontWeights)) {
            throw new Error('Unknown font weight '+weight);
        }
        return (label.createFont(fontname, fontsize, fontWeights[weight]));
    }
    return (cache(fonts, create, fontname, fontsize, weight));
}

var fontWeights = {
        'default': 0,
        'thin': 100,
        'extra light': 200,
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extra bold': 800,
        'heavy': 900
};

methods.label_print = function (p, a) {
    var hdc = label.createDc2(p, { dmOrientation: label.DMORIENT_LANDSCAPE });
    label.setBkMode(hdc, label.bkModeTransparent);
    label.beginPrint(hdc);
    label.startPage(hdc);
    var font = 'Helvetica';
    var size = 45;
    var halign = null;
    var valign = null;
    var weight = 'default';

    a.forEach(function (e) {
        if (e.font) {
            font = e.font;
        }
        if (e.size) {
            size = Math.round(e.size);
        }
        if (e.weight) {
            weight = e.weight;
        }
        if (e.halign) {
            halign = e.halign;
        }
        if (e.valign) {
            valign = e.valign;
        }
        if (e.text != null) {
            var align = 0;
            switch (halign) {
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
            switch(valign) {
            case 'top':
                align += label.TA_TOP;
                break;
            case 'bottom':
            default:
                align += label.TA_BOTTOM;
                break;
            case 'baseline':
                align += label.TA_BASELINE;
                break;
            case 'center':
                // Sigh.  Windows doesn't support it.  We should probably
                // synthesize it.  But not today.
                throw new Error('no valign=center');
            }

            label.setTextAlign(hdc, align);
            label.selectObject(hdc, getFont(font, size, weight));
            label.textOut(hdc, Math.round(e.x), Math.round(e.y),
                e.text.toString());
        }
        if (e.lineto) {
            label.moveTo(hdc, Math.round(e.x), Math.round(e.y));
            label.lineTo(hdc, Math.round(e.lineto.x), Math.round(e.lineto.y));
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

methods.listFontWeights = function () {
    return (Object.keys(fontWeights).sort(function (a, b) {
        return (fontWeights[a] - fontWeights[b]);
    }));
};

async function methodCallMiddleware(req, res, next)
{
    await busyCall(async function () {
        var body = req.body;
        if (Debug.rpc(2, '<==', body)) {
            if (req.file) {
                log('<==', req.file.path);
            }
        } else {
            Debug.rpc(1, '<==', body.name);
        }

        try {
            var ret = await methodCall(body, req.file);
        } finally {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
        }

        Debug.rpc(2, '==>', ret);

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
        log(msg);
        return ({ error: msg });
    }
    var retval;
    try {
        retval = await method.apply(null, params);
    } catch (e) {
        // This is a programmer error.
        // It would be good if we could *both* return an error *and*
        // dump one on the Node.js console.
        // Maybe we should have three exception classes:
        // - Server-side programmer error
        // - Caller-side programmer error
        // - User error
        if (!(e instanceof UserError)) {
            log(e);
        }
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

restExportMethods.export = async function (res, dbName, tName, params) {
    var t = await DBMS.getTable(dbName, tName);
    await Export.export(res, t, params);
};

// This middleware accepts a JSON-RPC request as a form parameter, and returns
// a file.  NEEDSWORK:  there is no way to return an error.
async function exportMiddleware(req, res, next) {
    await busyCall(async function () {
        var body = JSON.parse(req.body['request']);
        Debug.rpc(2, '<==', body)
        || Debug.rpc(1, '<==', body.name);
        await exportMethodCall(body, res);
        Debug.rpc(2, '==> file');
    });
}

async function exportMethodCall(req, res) {
    assert(req.name, 'No req.name');
    assert(req.params, 'No req.params');
    var method = restExportMethods[req.name];
    if (!method) {
        log('No such method '+req.name);
        return;
    }
    var params = req.params;
    // Note that we will prepend "res" to the method parameter list.
    var expected = method.length - 1;
    if (expected != params.length && !method.varargs) {
        var msg = sprintf("%s: argument mismatch, expected %d got %d",
            req.name, expected, params.length);
        log(msg);
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
        log(e);
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
    if (Debug.busy()) {
        status(
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
    let debugName = debugKey(c);
    if (debugName) {
        Debug[debugName].toggle();
        log(Debug[debugName].toString());
        return;
    }
    switch (c) {
    case '\x03':
        process.exit();
        break;
    case 'q':
        process.exit();
        break;
    case '?':
        log('q - quit');
        for (let debugName in Debug) {
            log(Debug[debugName].key + ' - ' + Debug[debugName].description
                + ' (' + Debug[debugName].toString() + ')');
        }
        break;
    default:
        log('Huh?  Press ? for a list of commands.');
        break;
    }
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
    app.use('/doc', express.static('../Documentation'));
    app.use('/install', express.static('install'));
    app.use(cookieParser());
    app.use(assignCookie);
    app.use(express.static('./static'));

    app.listen(port, function () {
      log('Registration listening on port '+port+'!')
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