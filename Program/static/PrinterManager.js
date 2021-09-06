var printerSchema = [
    [
        { field: 'server', label: 'Server name',
            readOnly: true,
            input: InputDBLookup,
            table: 'servers',
            textField: 'name'
        },
        { field: 'windows', label: 'Windows name', readOnly: true },
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
        canShowAll: true,
        canDelete: true
    };
    PrinterManager.prototype.Edit = PrinterEdit;

    PrinterManager.sup.constructor.call(o, params);
}
extend(DBManager, PrinterManager);

PrinterManager.prototype.activate = function () {
    var o = this;

    Printers.refresh(function () {
        PrinterManager.sup.activate.call(o);
    });
};

PrinterManager.prototype.getFilter = function () {
    return ({ not: { f: 'hide' } });
};

PrinterManager.prototype.summarize = function (k, r) {
    var serverName = td({ id: 'serverName' });
    if (r.server) {
        table.servers.get(r.server, function (r) {
            serverName.appendChild(r.name);
        });
    }
    return (tr(
        serverName,
        td(r.isLabel ? 'L' : '', { id: 'type' }),
        td(r.name, { id: 'name' }),
        td(r.windows, { id: 'windows' })
    ));
};

PrinterManager.prototype.header = function () {
    return (tr(
        th('Server name'),
        th('Type'),
        th('Name'),
        th('Windows name')
    ));
};

PrinterManager.prototype.title = 'Printer management';
PrinterManager.prototype.sort = [ 'server' ];

function PrinterEdit(/*args*/)
{
    PrinterEdit.sup.constructor.apply(this, arguments);
}

extend(DBEdit, PrinterEdit);

PrinterEdit.prototype.title = function () {
    // NEEDSWORK should probably be the Windows printer name
    return ('Configure printer...');
};


var Printers = {};

Printers.refresh = function (cb) {
    var id;
    var printers;
    
    Server.id(gotId);
    
    function gotId(idRet) {
        id = idRet;
        rpc.printers(gotWindowsPrinters);
    }
    function gotWindowsPrinters(printersRet) {
        printers = printersRet;
        table.printers.list({filter: { eq: [ {f: 'server'}, id ] } }, gotDBPrinters);
    }
    
    function gotDBPrinters(recs) {
        var k, found;
        var newPrinters = [];
        var deletePrinters = [];
        printers.forEach(function (p) {
            if (!recs.some(function (k, r) {
                return (r.windows == p.printerName);
            })) {
                newPrinters.push(p.printerName);
            }
        });
        recs.forEach(function (k, r) {
            if (!printers.some(function (p) {
                return (r.windows == p.printerName);
            })) {
                deletePrinters.push({k: k, r: r});
            }
        });
        function sync() {
            var p;
            if (p = newPrinters.pop()) {
                table.printers.add(null, { server: id, windows: p }, null, sync);
            } else if (p = deletePrinters.pop()) {
                table.printers.delete(p.k, p.r, sync);
            } else {
                cb();
            }
        }
        sync();
    };
};

Printers.get = function (id, cb) {
    table.printers.getOrNull(id, function (r) { cb(r); });
};

Printers.getPrinter = function (id, cb, abort) {
    if (cfg.noPrint) {
        alert('Would print label now');
        cb(null);
        return;
    }
    if (!id) {
        alert('No printer configured!');
        abort();
        return;
    }
    var p = new Printer(id);
    p.init(function () {
            cb(p);
    });
};

function Printer(id) {
    var o = this;
    o.id = id;
}

Printer.prototype.init = function (cb) {
    var o = this;

    Printers.get(o.id, gotPrinter);

    function gotPrinter(pRec) {
        o.winName = pRec.windows;
        rpc.printers(gotPrinters);
    }

    // It seems surprising and unfortunate that this is the only
    // way to retrieve this information.  I bet there's a "get status
    // of printer by name" function that I haven't found yet.
    // NEEDSWORK but even so, we should have an RPC request that does it.
    function gotPrinters(plist) {
        var pEnt;
        while (pEnt = plist.pop()) {
            if (pEnt.printerName == o.winName) {
                if (pEnt.attributes.WORK_OFFLINE) {
                    alert('Label printer is offline');
                    abort();
                    return;
                }
                rpc.label_getDeviceCaps(o.winName, gotCaps);
                return;
            }
        }
        throw new Error('Selected printer is in list, but not in enumeration');
    }
    
    function gotCaps(caps) {
        o.dpix = caps.dpix;
        o.dpiy = caps.dpiy;
        o.horzres = caps.horzres;
        o.vertres = caps.vertres;
        cb();
    }
};

Printer.prototype.print = function (items, cb) {
    var o = this;
    rpc.label_print(o.winName, items, cb);
}

Printer.prototype.measure = function (font, size, text, cb) {
    var o = this;
    rpc.label_measureText(o.winName, font, size, text, cb);
};

init.push(function printerInit() {
    table.printers = new DBTable(db.reg, 'printers',
        { defaults: Editor.defaults(printerSchema) }
    );
});
