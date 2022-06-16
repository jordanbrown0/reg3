var printerSchema = [
    [
        { field: 'server', label: 'Server name',
            readOnly: true,
            input: InputDBLookup,
            table: 'servers',
            textField: 'serverName'
        },
        { field: 'windows', label: 'Windows name', readOnly: true },
        { field: 'name', label: 'Name', default: '' },
        { field: 'isLabel', label: 'Label printer?', input: InputBool,
            default: false },
        { field: 'hide', label: 'Hide printer?', input: InputBool,
            default: false },
        { field: 'margins',
            label: 'Margins: Left, Right, Top, Bottom',
            input: InputObject,
            default: { left: 0, right: 0, top: 0, bottom: 0 },
            schema: [
                { field: 'left', input: InputInt, required: true },
                { field: 'right', input: InputInt, required: true },
                { field: 'top', input: InputInt, required: true },
                { field: 'bottom', input: InputInt, required: true }
            ]
        }
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
            serverName.appendChild(r.serverName);
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

function PrinterIdentify() {
    PrinterIdentify.sup.constructor.apply(this, arguments);
}

extend(DElement, PrinterIdentify);

PrinterIdentify.prototype.title = 'Identify Printers...';

PrinterIdentify.prototype.activate = function () {
    var o = this;
    var opts = {};
    var all = [];

    Server.id(gotServerID);

    function gotServerID(id) {
        table.printers.list({
            filter:
                { and: [
                    {not: {f: 'hide'}},
                    {f: 'isLabel'},
                    {eq: [ {f: 'server'}, id ] }
                ]},
            },
            gotPrinters
        );
    }

    function gotPrinters(recs) {
        recs.forEach(function (k, r) {
            opts[k] = joinTruthy([r.name, r.windows], ' / ');
            all.push(k);
        });
        if (all.length == 0) {
            modal('There are no label printers configured.', { ok: home });
        }

        o.bools.setOptions([opts]);
    }

    o.bools = new InputSelectMulti({});
    o.appendChild(o.bools);

    base.addCancel(home);
    base.addNav([
        { label: '&All', func: function () {
            Printers.identifyList(all, done);
        } },
        { label: '&Selected', func: function () {
            var list = o.bools.get();
            if (list.length > 0) {
                Printers.identifyList(o.bools.get(), done);
            } else {
                modal('It\'s boring if you don\'t select any printers.');
            }
        } }
    ]);

    function done() {
        modal('Identification labels sent.');
    }
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
                var pRec = {
                    server: id,
                    windows: p,
                    hide: Printers.inList(p, Printers.autoHideList),
                    isLabel: Printers.inList(p, Printers.autoLabelList)
                };
                table.printers.add(null, pRec, null, sync);
            } else if (p = deletePrinters.pop()) {
                table.printers.delete(p.k, p.r, sync);
            } else {
                cb();
            }
        }
        sync();
    };
};

Printers.autoHideList = [ 'Fax', 'PDF', 'XPS', 'OneNote' ];
Printers.autoLabelList = [ 'DYMO' ];

Printers.inList = function (winName, list) {
    return (list.some(function(s) {
        return (winName.indexOf(s) >= 0);
    }));
};

Printers.get = function (id, cb) {
    table.printers.getOrNull(id, function (r) { cb(r); });
};

Printers.getPrinter = function (id, cb, abort) {
    if (cfg.noPrint) {
        // Note that cb(null) is *not* an error; it means that printing is
        // disabled, for test reasons, but the caller should behave as if
        // it had printed the label.  Perhaps instead it should return a dummy
        // Printer object, so that the caller doesn't have to know about this
        // case.  That would also free up cb(null) to use as an error case.
        modal('Would print label now.', { ok: function() { cb(null); }});
        return;
    }
    if (!id) {
        modal('No printer configured!', { ok: abort });
        return;
    }
    var p = new Printer(id);
    p.init(function () {
            cb(p);
    }, abort);
};

Printers.testCurrent = function () {
    Printers.identify(cfg.label, home);
};

Printers.identifyList = function (list, cb) {
    // Note that we can't just shift away the list because the caller
    // is still using it.
    var i = 0;
    function identify() {
        if (i >= list.length) {
            cb();
            return;
        }
        var k = list[i];
        i++;
        Printers.identify(k, identify);
    }
    identify();
};

Printers.identify = function (k, cb) {
    var p;
    var testSize;
    var s = 'TEST';

    Printers.getPrinter(k, gotPrinter, cb);

    function gotPrinter(p_) {
        p = p_;
        // Check for printing disabled.
        if (!p) {
            cb();
            return;
        }
        testSize = p.dpiy / 2;
        p.measure(cfg.font, testSize, cfg.weight, s, gotDims);
    }
    function gotDims(testDims) {
        var x = p.limits.x + p.limits.h/2;
        var y = p.limits.y - p.limits.v/2 + testDims.cy/2;
        var rightx = p.limits.x + p.limits.h - 1;
        var topy = p.limits.y - p.limits.v + 1;
        var items = [
            { font: cfg.font, halign: 'center' },

            { x: x, y: y, size: testSize, weight: cfg.weight, valign: 'bottom',
                text: s },

            { size: p.dpiy/5, weight: 'default' },
            { x: x, y: topy, valign: 'top', text: p.pname },
            { x: x, y: p.limits.y, valign: 'bottom', text: p.winName },

            { x: p.limits.x, y: p.limits.y, lineto: { x: rightx, y: topy }},
            { x: p.limits.x, y: topy, lineto: { x: rightx, y: p.limits.y }},

            { x: p.limits.x, y: p.limits.y,
                lineto: { x: rightx, y: p.limits.y }},
            { x: rightx, y: p.limits.y, lineto: { x: rightx, y: topy }},
            { x: rightx, y: topy, lineto: { x: p.limits.x, y: topy }},
            { x: p.limits.x, y: topy, lineto: { x: p.limits.x, y: p.limits.y }}
        ];

        p.print(items, cb);
    }
};

function Printer(id) {
    var o = this;
    o.id = id;
}

Printer.prototype.init = function (cb, abort) {
    var o = this;

    Printers.get(o.id, gotPrinter);

    function gotPrinter(pRec) {
        o.pname = pRec.name;
        o.winName = pRec.windows;
        o.margins = {
            left: pRec.margins.left + cfg.margins.left,
            right: pRec.margins.right + cfg.margins.right,
            top: pRec.margins.top + cfg.margins.top,
            bottom: pRec.margins.bottom + cfg.margins.bottom
        };
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
                    modal('Label printer '
                        + joinTruthy([o.pname, o.winName], ' / ')
                        + ' is offline.',
                        { ok: abort}
                    );
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
        o.limits = {
            x: o.margins.left,
            y: caps.vertres - o.margins.bottom - 1,
            h: caps.horzres - o.margins.left - o.margins.right,
            v: caps.vertres - o.margins.bottom - o.margins.top
        };
        cb();
    }
};

Printer.prototype.print = function (items, cb) {
    var o = this;
    rpc.label_print(o.winName, items, cb);
}

Printer.prototype.measure = function (font, size, weight, text, cb) {
    var o = this;
    rpc.label_measureText(o.winName, font, size, weight, text, cb);
};

Printer.prototype.points = function (points) {
    var o = this;
    return points * o.dpiy/72;
};

Printer.prototype.inches = function (inches) {
    var o = this;
    return inches * o.dpiy;
};

init.push(function printerInit() {
    table.printers = new DBTable(db.reg, 'printers',
        { schema: printerSchema }
    );
});
