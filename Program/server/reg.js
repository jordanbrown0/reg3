const port = 80;
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
// const bodyParser = require('body-parser');
const DBMS = require('./DBMS');
const DBF = require('./DBF');
const label = require('myclinic-drawer-printer').api;
const sprintf = require('sprintf-js').sprintf;
// const readline = require('readline');
const Expression = require('./Expression');
const { assert } = require('./utils');

// NEEDSWORK:  general trace mechanism
var rpcVerbose = false;
var showBusy = true;

var methods = {};

methods.methods = function () {
	return (Object.keys(methods));
};

// Load the specified database.
// This is not strictly necessary, because the database is lazy-loaded
// whenever referenced.  However, it allows you to move the performance
// hit to a UI-convenient place.
methods.DBload = async function (dbName) {
	await DBMS.getDB(dbName);
};

methods.DBadd = async function (dbName, tName, k, r, expr) {
	return ((await getTable(dbName, tName)).add(k, r, expr));
};

methods.DBlist = async function (dbName, tName, params) {
	return ((await getTable(dbName, tName)).list(params));
}

methods.DBreduce = async function (dbName, tName, params) {
	return ((await getTable(dbName, tName)).reduce(params));
}

methods.DBget = async function(dbName, tName, k) {
	return ((await getTable(dbName, tName)).get(k));
};

methods.DBgetOrAdd = async function(dbName, tName, k, expr) {
	return ((await getTable(dbName, tName)).getOrAdd(k, expr));
};

methods.DBgetOrNull = async function(dbName, tName, k) {
	return ((await getTable(dbName, tName)).getOrNull(k));
};

methods.DBput = async function (dbName, tName, k, r, expr) {
	return ((await getTable(dbName, tName)).put(k, r, expr));
};

methods.DBdelete = async function (dbName, tName, k, r) {
	return ((await getTable(dbName, tName)).delete(k, r));
};

methods.DBinc = async function (dbName, tName, k, field, limitField) {
	return ((await getTable(dbName, tName)).inc(k, field, limitField));
};

methods.DBlistTables = async function (dbName) {
	return ((await DBMS.getDB(dbName)).listTables());
};

methods.importDBF = async function (dbName, tName, filename, map) {
	var t = await getTable(dbName, tName);
	var t0 = Date.now();
	var dbf = new DBF(filename, map);
	await dbf.load();
	t.sync(false);
	await dbf.all(function (dbf_r) {
		var db_r = {};
		// NEEDSWORK:  Perhaps we should lowercase dBASE field names in the DBF
		// processing, so that we don't need to do it here.  But they *are*
		// conventionally upper case in dBASE.
		for (f in dbf_r) {
			db_r[f.toLowerCase()] = dbf_r[f];
		}
		if (db_r._deleted) {
			// NEEDSWORK:  dBASE deleted records have data preserved.
			// Our deleted records do not; they are only a tombstone.
			// Adding a deleted record with data would be a violation of the
			// definition.
			// Adding a tombstone would be pointless because this is a new
			// record, from our DBMS's point of view.
			// We'll just ignore dBASE deleted records for now.
			// Is that the best answer?
			return;
		}
		delete db_r._deleted;
		t.add(null, db_r, null);
	});
	await dbf.close();
	t.sync(true);
	console.log('took', Date.now()-t0);
};

methods.nop = function () {
	return ('Bored now');
}

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
	label.setTextAlign(hdc, label.TA_LEFT + label.TA_BOTTOM);
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
			size = e.size;
		}
		if (e.text != null) {
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

var totalIdle = 0;
var totalBusy = 0;
var tPrev = null;

async function methodcallmiddleware(req, res, next)
{
	var tStart = hrtime();

	if (rpcVerbose) {
		console.log('<==', req.body);
	}
	var ret = await methodcall(req.body);
	if (rpcVerbose) {
		console.log('==>', ret);
	}
	res.json(ret);
	
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
var busyTick = 1000;	// ms

function tick() {
	const alpha = 0.2;
	var newBusy = totalBusy / (busyTick*1000*1000);
	totalBusy = 0;
	totalIdle = 0;
	avgBusy += alpha*(newBusy-avgBusy);
	if (showBusy) {
		process.stdout.write(sprintf("\r%5.1f%% busy", avgBusy*100));
	}
}

setInterval(tick, busyTick).unref();
 
async function methodcall(req)
{
	assert(req.name, 'No req.name');
	assert(req.params, 'No req.params');
	var method = methods[req.name];
	if (!method) {
		return ({error: 'No such method '+req.name});
	}
	var params = req.params;
	if (method.length != params.length) {
		var msg = sprintf("%s: argument mismatch, expected %d got %d",
		    req.name, method.length, params.length);
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

async function getTable(dbName, tName) {
	var db = await DBMS.getDB(dbName);
	var t = db.getTable(tName);
	return (t);
};

// These methods accept a result object (a subclass of a writable stream)
// and an argument list from the caller, and must emit an appropriate file
// onto the stream.
var restExportMethods = {};

restExportMethods.exportDB = async function (res, dbName, tables) {
	res.attachment(dbName+'.json');
	var db = await DBMS.getDB(dbName);
	db.writeStream(res, tables);
	res.end();
};

// This middleware accepts a JSON-RPC request as a form parameter, and returns
// a file.
function formJson(paramName) {
	return (async function (req, res, next) {
		var request = JSON.parse(req.body[paramName]);
		if (rpcVerbose) {
			console.log('<==', request);
		}
		var name = request.name;
		var params = request.params;
		params.unshift(res);
		await restExportMethods[name].apply(null, params);
		if (rpcVerbose) {
			console.log('==> file');
		}
	});
}

var restImportMethods = {};

restImportMethods.importDB = async function (req) {
	var db = await DBMS.getDB(req.params.db);
	return (await db.import(req));
};

// This function accepts a file, and returns a JSON-RPC response.
async function importMiddleware(req, res, next) {
	if (rpcVerbose) {
		console.log('<==', req.url);
	}
	
	var ret = await restImportMethods[req.params.name](req);
	
	if (rpcVerbose) {
		console.log('==>', ret);
	}
	res.json(ret);
	res.end();
}

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
		rpcVerbose = !rpcVerbose;
		console.log(rpcVerbose
			? 'Tracing RPC'
			: 'Not tracing RPC');
		break;
	case 'b':
		showBusy = !showBusy;
		console.log(showBusy
			? 'Showing busy percentage'
			: 'Not showing busy percentage');
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
		console.log('b - toggle busy monitor');
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
		.put(methodcallmiddleware);
	app.route('/REST')
		.post(express.urlencoded({extended: true}))
		.post(formJson('request'));
	app.route('/REST/:name/:db')
		.put(importMiddleware);
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