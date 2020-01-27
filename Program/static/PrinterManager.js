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
        function sync() {
            var p;
            if (p = newPrinters.pop()) {
                table.printers.add(null, { server: id, windows: p }, null, sync);
            } else if (p = deletePrinters.pop()) {
                table.printers.delete(p.k, p.r, sync);
            } else {
                cb();
            }
        };
        sync();
    };
};

// NEEDSWORK should be Printers.get().

Printers.get = function (id, cb) {
    table.printers.getOrNull(id, function (r) { cb(r); });
};

init.push(function printerInit() {
    table.printers = new DBTable(db.reg, 'printers',
        { defaults: Editor.defaults(printerSchema) }
    );
});
