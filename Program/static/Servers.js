var serverSchema = [
    [
        { field: 'serverName', label: 'Server name',
            default: 'Unconfigured', required: true },
        { field: 'noPrint', label: 'Disable printing?', input: InputBool,
            default: false },
        { field: 'nextNumber', label: 'Next membership number to assign',
            input: InputInt, default: null, required: true },
        { field: 'lastNumber', label: 'Last membership number to assign',
            input: InputInt, default: null, required: true },
    ],
];
var serverDefault = undefined;
var serverID = undefined;

function ServerManager() {
    var o = this;
    params = {
        table: table.servers,
        schema: serverSchema,
        canDelete: true
    };
    ServerManager.sup.constructor.call(o, params);
    // When called from ServerManager, we don't need a custom ServerEdit.
    // It's needed when called from "configure this server", to supply
    // the key and appropriate parameters.
    ServerManager.prototype.Edit = ServerEdit;
}
extend(DBManager, ServerManager);

ServerManager.prototype.title = 'Administer servers...';

ServerManager.prototype.summarize = function (k, r) {
    return (new DElement('tr',
        new DElement('td', r.serverName, { id: 'name' }),
        new DElement('td', r.nextNumber || '', { id: 'nextNumber' }),
        new DElement('td', r.lastNumber || '', { id: 'lastNumber' })
    ));
};

ServerManager.prototype.header = function () {
    return (tr(
        th('Name'),
        th('Next'),
        th('Last')
    ));
};

function ServerEdit(k, params) {
    var o = this;
    if (!k) {
        k = serverID;
    }
    if (!params) {
        params = {
            table: table.servers,
            schema: serverSchema
        };
    }
    if (k == serverID) {
        params.reconfig = true;
    }
    ServerEdit.sup.constructor.call(o, k, params);
}

extend(DBEdit, ServerEdit);

ServerEdit.prototype.title = 'Server configuration...';

ServerEdit.prototype.delete = function (cb) {
    var o = this;
    ServerEdit.sup.delete.call(o, function (deleted) {
        if (deleted) {
            sequence(cb, [
                [ deleteDependents, 'stations' ],
                [ deleteDependents, 'printers' ]
            ]);
        } else {
            base.switchTo(new ServerEdit(o.k, o.params));
        }
    });

    function deleteDependents(cb, tName) {
        table[tName].reduce({
            expr: {
                if: [
                    { eq: [ { f: 'server' }, o.k ] },
                    { delete: [] }
                ]
            }
        }, cb);
        return (true);
    }
};

var Server = {};

Server.newMembershipNumber = function (cb) {
    Server.id(function (id) {
        table.servers.inc(id, 'nextNumber', 'lastNumber', function (n) {
            cb(n);
        });
    });
};

Server.get = function(cb) {
    Server.id(function (id) {
        table.servers.getOrAdd(id, {},
            { setf: ['serverName', { defaultServerName: []}]}, cb);
    });
};

// Retrieve and cache the server ID.
Server.id = function (cb) {
    if (serverID != undefined) {
        cb(serverID);
    } else {
        rpc.getServerID(function (id) {
            serverID = id;
            cb(serverID);
        });
    }
};

init.push(function serversInit(cb) {
    table.servers = new DBTable(db.reg, 'servers',
        { schema: serverSchema }
    );
    cb();
    return (true);
});
