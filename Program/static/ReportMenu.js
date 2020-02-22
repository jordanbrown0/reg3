function ReportMenu()
{
    var o = this;
    ReportMenu.sup.constructor.call(o, 'div');
    o.menu = new Menu({ items: [
        { key: 't', label: '(T)allies of members', func: function () {
            base.switchTo(new ReportTallies());
        }},
        { key: 'l', label: '(L)ist', func: function () {
            base.switchTo(new ReportList());
        }},
        { key: 'd', label: '(D)uplicates', func: function () {
            base.switchTo(new ReportDupsSetup());
        }}
    ]});
    o.appendChild(o.menu);
}
extend(DElement, ReportMenu);

ReportMenu.prototype.activate = function () {
    var o = this;
    o.menu.activate();
    base.addNav([
        { key: 'Escape', msg: 'Cancel', func: function () { home(); } }
    ]);
};

ReportMenu.prototype.title = 'Reports';

// This needs to be refactored a bit and recombined with the one in labels.js.
// NEEDSWORK
function getReportPrinterInfo(cb, abort) {
    var printer;

    if (!cfg.reportPrinter) {
        alert('No printer configured!');
        abort();
        return;
    }
    Printers.get(cfg.reportPrinter, gotPrinter);

    function gotPrinter(p) {
        printer = p.windows;
        rpc.printers(gotPrinters);
    }

    // It seems surprising and unfortunate that this is the only
    // way to retrieve this information.  I bet there's a "get status
    // of printer by name" function that I haven't found yet.
    function gotPrinters(plist) {
        var p;
        while (p = plist.pop()) {
            if (p.printerName == printer) {
                if (p.attributes.WORK_OFFLINE) {
                    alert('Label printer is offline');
                    abort();
                    return;
                }
                rpc.label_getDeviceCaps(printer, gotCaps);
                return;
            }
        }
        throw new Error('Selected printer is in list, but not in enumeration');
    }
    
    function gotCaps(res) {
        cb({cfg: cfg, printer: printer, caps: res});
    }
}