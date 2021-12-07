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
StationManager.prototype.sort = [ 'server', 'stationName' ];

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
            serverName.appendChild(r.serverName);
        });
    }
    // NEEDSWORK UPGRADE old versions have metaclasses as a string; new
    // versions have it as an array.  How should we really handle upgrades
    // like this?  Ideally, we would not keep legacy interpretations like this
    // around indefinitely.  However, it's also desirable to be able to
    // upgrade old conventions to use new software.
    if (typeof(r.metaclasses) == 'string') {
        r.metaclasses = [ r.metaclasses ];
    }
    return (tr(
        serverName,
        td(r.stationName, { id: 'name' }),
        td(r.metaclasses ? r.metaclasses.join(', ') : '', { id: 'metaclasses' }),
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
    if (!k) {
        k = stationID;
    }
    if (params) {
        params = Object.assign({}, params);
    } else {
        params = {
            table: table.stations,
            schema: stationSchema,
        };
    }
    if (k == stationID) {
        params.reconfig = true;
    }

    StationEdit.sup.constructor.call(o, k, params);
}

extend(DBEdit, StationEdit);

StationEdit.prototype.title = 'Configure station...';

StationEdit.prototype.activate = function () {
    var o = this;
    Printers.refresh(function () {
        StationEdit.sup.activate.call(o);
    });
};

StationEdit.prototype.get = function (cb) {
    var o = this;
    StationEdit.sup.get.call(o, function (r) {
        // NEEDSWORK UPGRADE old versions have metaclasses as a string; new
        // versions have it as an array.  How should we really handle upgrades
        // like this?  Ideally, we would not keep legacy interpretations like this
        // around indefinitely.  However, it's also desirable to be able to
        // upgrade old conventions to use new software.
        if (typeof(r.metaclasses) == 'string') {
            r.metaclasses = [ r.metaclasses ];
        }
        cb(r);
    });
};

// NEEDSWORK:  A > C > StationEdit should maybe create record if needed.

var Station = {};

Station.get = function (cb) {
    // NEEDSWORK:  If you have a station running on one server and you move it
    // to another server without refreshing, the station's server ID won't be
    // fixed. Or maybe something stupider.
    Server.id(function (id) {
        table.stations.getOrAdd(stationID, {server: id}, null, function (r) {
            if (r.server != id) {
                // Station has been moved to a different server; update it.
                // This is probably not enough.  Reference issue #158.
                r.server = id;
                delete r.label;
                table.stations.put(stationID, r, null, function (conflict) {
                    assert(conflict == null, 'Record update conflict');
                    table.stations.get(stationID, function (rNew) {
                        cb(rNew);
                    })
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

var stationSchema = [
    [
        { title: 'General' },
        { field: 'stationName', label: 'Station name',
            default: 'Unconfigured',
            required: true
        },
        { field: 'server', label: 'Server name',
            readOnly: true,
            input: InputDBLookup,
            table: 'servers',
            textField: 'serverName'
        },
        { field: 'label', label: 'Label Printer', input: InputDBPicker,
            table: 'printers',
            textField: function (r) {
                return (joinTruthy([r.name, r.windows], ' / '));
            },
            filter: Station.labelPrinterFilter,
            default: ''
        },
        { field: 'metaclasses', label: 'Metaclasses', input: InputSelectMultiDB,
            table: 'metaclasses', keyField: 'name', textField: 'description'},
    ],
    [
        { title: 'Offline Operations' },
        { field: 'offlinePrint', label: 'Print badges now?', input: InputBool, default: true },
        { field: 'offlineMarkPickedUp', label: 'Mark badges picked up?',
            input: InputBool, default: true },
        { field: 'offlineRealTime', label: 'Use current time for records?',
            input: InputBool, default: true },
        { field: 'offlineAsOf', label: 'If not, keep records as of',
            input: InputDateTime, default: '' }
    ],
    [
        { title: 'Permissions' },
        { field: 'permissions', label: 'Permissions', input: InputSelectMulti,
            options: [
                { newMember: 'Add new member' },
                { admin: 'Administration' },
                { reports: 'Reports' },
                { allDays: 'Issue classes on all days' },
                { upgrade: 'Process upgrades' },
                { adHocUpgrades: 'Ad hoc upgrades (requires "Process upgrades")' },
                { transfer: 'Process transfers' },
                { unmark: 'Mark membership as not-picked-up' },
                { void: 'Void / unvoid memberships' }
            ],
            default: [
                'adHocUpgrades', 'admin', 'newMember', 'reports',
                'transfer', 'upgrade', 'unmark', 'void'
            ]
        }
    ],
];

init.push(function stationsInit() {
    table.stations = new DBTable(db.reg, 'stations',
        { schema: stationSchema }
    );
});
