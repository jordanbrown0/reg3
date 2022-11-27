var serverSchema = [
    [
        { field: 'serverName', label: 'Server name',
            default: 'Unconfigured', required: true },
        { field: 'noPrint', label: 'Disable printing?', input: InputBool,
            default: false },
        { field: 'nextNumber', label: 'Next membership number to assign',
            input: InputInt, default: null, minimum: 1 },
        { field: 'lastNumber', label: 'Last membership number to assign',
            input: InputInt, default: null, minimum: 1 },
        { field: 'lastExport', label: 'Last sync from this server',
            input: InputDateTime, readOnly: true },
    ],
];

var membershipNumbersSchema = [
    [
        { field: 'nextNumber', label: 'Next membership number to assign',
            input: InputInt, default: null, minimum: 1, required: true },
        { field: 'lastNumber', label: 'Last membership number to assign',
            input: InputInt, default: null, minimum: 1, required: true },
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
    var tdNext = td({ id: 'nextNumber' });
    var tdLast = td({ id: 'lastNumber' });
    table.membershipNumbers.getOrAdd(k, {}, null,   function (mn) {
        tdNext.replaceChildren(mn.nextNumber || '');
        tdLast.replaceChildren(mn.lastNumber || '');
    });
    return (tr(
        td(r.serverName, { id: 'name' }),
        tdNext,
        tdLast,
        td(r.lastExport
            ? LDate.fromJSON(r.lastExport).toDisplay({seconds:true})
            : ''
        )
    ));
};

ServerManager.prototype.header = function () {
    return (tr(
        th('Name'),
        th('Next'),
        th('Last'),
        th('Last synced')
    ));
};

function ServerEdit(k, params) {
    var o = this;
    if (!k) {
        k = serverID;
    }
    if (params) {
        params = Object.assign({}, params);
    } else {
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

ServerEdit.prototype.get = function (cb) {
    var o = this;
    ServerEdit.sup.get.call(o, function (r) {
        table.membershipNumbers.getOrAdd(o.k, {}, null, function (r2) {
            o.rMembershipNumbers = r2;
            // Don't use Object.assign, because we don't want to copy
            // _version.
            r.nextNumber = r2.nextNumber;
            r.lastNumber = r2.lastNumber;
            cb(r);
        })
    });
};

ServerEdit.prototype.put = function (cb) {
    var o = this;
    if (o.r.nextNumber && o.r.lastNumber) {
        if (o.r.nextNumber > o.r.lastNumber+1) {
            working(false);
            // Slight lie, because we allow next=last+1 so that you can set
            // an empty range, should you want to.
            modal('Next number is after last number.');
            return;
        }
    } else if (o.r.nextNumber || o.r.lastNumber) {
        working(false);
        modal('Specify both membership number limits, or neither.')
        return;
    }
    
    var r2 = Object.assign({}, o.rMembershipNumbers);
    r2.nextNumber = o.r.nextNumber;
    r2.lastNumber = o.r.lastNumber;
    delete o.r.nextNumber;
    delete o.r.lastNumber;
    ServerEdit.sup.put.call(o, function () {
        o.r.nextNumber = r2.nextNumber;
        o.r.lastNumber = r2.lastNumber;
        if (r2.nextNumber === o.rMembershipNumbers.nextNumber
            && r2.lastNumber === o.rMembershipNumbers.lastNumber) {
            cb();
            return;
        }
        table.membershipNumbers.put(o.k, r2, null, function (conflict) {
            ConflictResolver.resolve(conflict, function (rNew) {
                if (rNew) {
                    o.r.nextNumber = rNew.nextNumber;
                    o.r.lastNumber = rNew.lastNumber;
                }
                cb();
            });
        });
    });
};

ServerEdit.prototype.delete = function (cb) {
    var o = this;
    ServerEdit.sup.delete.call(o, function (deleted) {
        if (deleted) {
            sequence(cb, [
                [ deleteDependents, 'stations' ],
                [ deleteDependents, 'printers' ],
                [ deleteMN ]
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

    function deleteMN(cb) {
        table.membershipNumbers.delete(o.k, null, cb);
    }
};

var Server = {};

Server.newMembershipNumber = function (cb) {
    Server.id(function (id) {
        table.membershipNumbers.inc(id, 'nextNumber', 'lastNumber', function (n) {
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

Server.getMembershipNumbers = function(cb) {
    Server.id(function (id) {
        table.membershipNumbers.getOrAdd(id, {}, null, cb);
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
    table.membershipNumbers = new DBTable(db.reg, 'membershipNumbers',
        { schema: membershipNumbersSchema }
    );
    cb();
    return (true);
});
