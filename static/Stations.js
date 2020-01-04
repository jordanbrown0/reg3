var stationSchema = [
	[
		{ title: 'Station Configuration' },
		{ field: 'name', label: 'Station name', default: 'Unconfigured', required: true },
		{ field: 'label', label: 'Label Printer', input: InputDBPicker,
			table: 'printers',
			textField: function (r) {
				return (joinTruthy([r.name, r.windows], ' / '));
			},
			default: ''
		},
		{ field: 'reportPrinter', label: 'Report printer',
			input: InputDBPicker,
			table: 'printers',
			textField: function (r) {
				return (joinTruthy([r.name, r.windows], ' / '));
			},
			default: ''
		},
		{ field: 'metaclasses', label: 'Metaclasses', default: '' },
		{ title: 'Offline Operations' },
		{ field: 'offlinePrint', label: 'Print badges now?', input: InputBool, default: true },
		{ field: 'offlineMarkPickedUp', label: 'Mark badges picked up?',
			input: InputBool, default: true },
		{ field: 'offlineRealTime', label: 'Use current time for records?',
			input: InputBool, default: true },
		{ field: 'offlineAsOf', label: 'If not, keep records as of',
			input: InputDateTime, default: '' }
	],
];
var stationDefault;

function StationManager() {
    var o = this;
	params = {
		table: table.stations,
		schema: stationSchema,
		canDelete: true
	};
	StationManager.sup.constructor.call(o, params);
	// When called from StationManager, we don't need a custom StationEdit.
	// It's needed when called from "configure this station", to supply
	// the key and appropriate parameters.
	StationManager.prototype.Edit = StationEdit;
}
extend(DBManager, StationManager);

StationManager.prototype.summarize = function (k, r) {
	var printerName = new DElement('td', { id: 'printerName' });
	// NEEDSWORK what if printer no longer exists?
	if (r.label) {
		getPrinter(r.label, function (r) {
			printerName.appendChild(joinTruthy([r.name, r.windows], ' / '));
		});
	}
	return (new DElement('tr',
		new DElement('td', r.name, { id: 'name' }),
		new DElement('td', r.metaclasses, { id: 'metaclasses' }),
		printerName
	));
};

StationManager.prototype.header = function () {
	return (new DElement('tr',
		new DElement('th', 'Station name'),
		new DElement('th', 'Metaclasses'),
		new DElement('th', 'Label printer')
	));
};

function StationEdit(k, params) {
	var o = this;
	StationEdit.sup.constructor.call(o,
		k || station_id,
		params || { table: table.stations, schema: stationSchema }
	);
}

extend(DBEdit, StationEdit);

StationEdit.prototype.activate = function () {
	var o = this;
	Printers.refresh(function () {
		StationEdit.sup.activate.call(o);
	});
};

// NEEDSWORK list/delete/pick conflict will recreate record.
// StationManager -> StationEdit really shouldn't use getOrAdd.
StationEdit.prototype.get = function (cb) {
	var o = this;
	Station.getX(o.k, cb);
};

var Station = {};

Station.getX = function (k, cb) {
	table.stations.getOrAdd(k, cb);
};

Station.get = function (cb) {
	Station.getX(station_id, cb);
};

init.push(function () {
	table.stations = new DBTable(db.reg, 'stations',
		{ defaults: Editor.defaults(stationSchema) }
	);
});
