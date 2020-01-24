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

StationManager.prototype.title = 'Administer all stations...';

StationManager.prototype.summarize = function (k, r) {
	var labelName = td({ id: 'labelName' });
	if (r.label) {
		Printers.get(r.label, function (pRec) {
			var s = pRec
                ? joinTruthy([pRec.name, pRec.windows], ' / ')
                : '(missing)';
            labelName.appendChild(s);
		});
	}
    var serverName = td({ id: 'server' });
    if (r.server) {
        table.servers.get(r.server, function (r) {
            serverName.appendChild(r.name);
        });
    }
	return (tr(
        serverName,
		td(r.name, { id: 'name' }),
		td(r.metaclasses, { id: 'metaclasses' }),
		labelName
	));
};

StationManager.prototype.header = function () {
	return (tr(
		th('Server name'),
		th('Station name'),
		th('Metaclasses'),
		th('Label printer')
	));
};

function StationEdit(k, params) {
	var o = this;
    var myParams = {};
    if (params) {
        myParams = Object.assign(myParams, params);
    }
    Object.assign(myParams, {
        table: table.stations,
        schema: stationSchema,
    });
	StationEdit.sup.constructor.call(o,
		k || stationId,
		myParams
	);
}

extend(DBEdit, StationEdit);

StationEdit.prototype.activate = function () {
	var o = this;
	Printers.refresh(function () {
		StationEdit.sup.activate.call(o);
	});
};

StationEdit.prototype.title = 'Configure station...';

// NEEDSWORK:  A > S > StationEdit should maybe create record if needed.

var Station = {};

Station.get = function (cb) {
    // NEEDSWORK:  If you have a station running on one server and you move it
    // to another server without refreshing, the station's server ID won't be
    // fixed. Or maybe something stupider.
    Server.id(function (id) {
        table.stations.getOrAdd(stationId, {server: id}, null, function (r) {
            if (r.server != id) {
                r.server = id;
                table.stations.put(stationId, r, null, function (rNew) {
                    cb(rNew);
                });
                return;
            }
            cb(r);
        });
    });
};

Station.printerFilter = function (params) {
    var f = {and: [
        {not: {f: 'hide'}},
        {eq: [ {f: 'server'}, params.r.server ] }
    ] };
    return (f);
};

Station.labelPrinterFilter = function (params) {
    var f = {and: [
        {f: 'isLabel'},
        Station.printerFilter(params)
    ]};
    return (f);
};

Station.reportPrinterFilter = function (params) {
    var f = {and: [
        {not: {f: 'isLabel'}},
        Station.printerFilter(params)
    ]};
    return (f);
};

var stationSchema = [
	[
		{ title: 'General' },
		{ field: 'name', label: 'Station name', default: 'Unconfigured', required: true },
		{ field: 'server', label: 'Server name',
            readOnly: true,
            input: InputDBLookup,
            table: 'servers',
            textField: 'name'
        },
		{ field: 'label', label: 'Label Printer', input: InputDBPicker,
			table: 'printers',
			textField: function (r) {
				return (joinTruthy([r.name, r.windows], ' / '));
			},
            filter: Station.labelPrinterFilter,
			default: ''
		},
		{ field: 'reportPrinter', label: 'Report printer',
			input: InputDBPicker,
			table: 'printers',
			textField: function (r) {
				return (joinTruthy([r.name, r.windows], ' / '));
			},
            filter: Station.reportPrinterFilter,
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

init.push(function stationsInit() {
	table.stations = new DBTable(db.reg, 'stations',
		{ defaults: Editor.defaults(stationSchema) }
	);
});
