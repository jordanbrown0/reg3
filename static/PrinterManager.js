var printerSchema = [
	[
		{ field: 'windows', label: 'Windows name', readonly: true },
		{ field: 'name', label: 'Name', default: '' },
		{ field: 'isLabel', label: 'Label printer?', input: InputBool,
			default: false },
		{ field: 'hide', label: 'Hide printer?', input: InputBool,
			default: false },
	]
];

function PrinterManager() {
    var o = this;
	var params = {
		table: table.printers,
		schema: printerSchema,
		canShowAll: true
	};
	PrinterManager.sup.constructor.call(o, params);
}
extend(DBManager, PrinterManager);

PrinterManager.prototype.activate = function () {
	var o = this;

	Printers.refresh(function () {
		PrinterManager.sup.activate.call(o);
	});
};

PrinterManager.prototype.filter = { not: { f: 'hide' } };

PrinterManager.prototype.summarize = function (k, r) {
	return (new DElement('tr',
		new DElement('td', r.isLabel ? 'L' : '', { id: 'type' }),
		new DElement('td', r.name, { id: 'name' }),
		new DElement('td', r.windows, { id: 'windows' })
	));
};

var Printers = {};

Printers.refresh = function (cb) {
    rpc.printers(function (printers) {
		table.printers.list({filter: true}, function (recs) {
			var k, found;
			var newPrinters = [];
			var deletePrinters = [];
			printers.forEach(function (p) {
				if (!someArrayObject(recs, function (k, r) {
					return (r.windows == p.printerName);
				})) {
					newPrinters.push(p.printerName);
				}
			});
			forEachArrayObject(recs, function (k, r) {
				if (!printers.some(function (p) {
					return (r.windows == p.printerName);
				})) {
					deletePrinters.push({k: k, r: r});
				}
			});
			var sync = function () {
				var p;
				if (p = newPrinters.pop()) {
					table.printers.add(null, { windows: p }, sync);
				} else if (p = deletePrinters.pop()) {
					table.printers.delete(p.k, p.r, sync);
				} else {
					cb();
				}
			};
			sync();
		});
	});
};

function getPrinter(id, cb) {
	table.printers.get(id, function (r) { cb(r); });
}

init.push(function () {
	table.printers = new DBTable(db.reg, 'printers',
		{ defaults: Editor.defaults(printerSchema) }
	);
});
