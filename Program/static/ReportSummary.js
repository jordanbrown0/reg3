function ReportSummary()
{
    var o = this;
    ReportSummary.sup.constructor.call(o);
}
extend(Report, ReportSummary);

ReportSummary.prototype.activate = function () {
    var o = this;
    base.addNav([
        { label: '&Label', order: 20, func: function () { o.label(); } },
    ]);
    ReportSummary.sup.activate.call(o);
};

ReportSummary.prototype.header = function () {
    var o = this;
    return (tr(th('Membership Statistics', { colSpan: 2 })));
};

ReportSummary.prototype.body = function (cb) {
    var o = this;

    var atdExpr;
    if (cfg.startDate) {
        atdExpr = { and: [
            { f: 'entered' },
            { ge: [
                { f: 'entered' },
                cfg.startDate
            ]}
        ]};
    } else {
        atdExpr = { f: 'entered' };
    }
    table.members.reduce(
        { expr:
            { if: [
                { f: 'transferTo' },
                { addto: [ 'transferred', 1 ]},
                { if: [
                    { f: 'void' },
                    { addto: [ 'void', 1 ]},
                    [
                        { if: [
                            { f: 'pickedup' },
                            { addto: [ 'warm', 1 ]},
                            { addto: [ 'noShow', 1 ]}
                        ]},
                        { if: [
                            atdExpr,
                            { addto: [ 'atTheDoor', 1 ]},
                            { addto: [ 'prereg', 1 ]}
                        ]}
                    ]
                ]}
            ]}
        },
        function (ret) {
            ret.grand = (ret.warm||0) + (ret.noShow||0);
            var body = [];
            o.lines = [
                { v: ret.warm,          t: 'Warm bodies' },
                { v: ret.noShow,        t: 'No show' },
                { v: ret.prereg,        t: 'Preregistered' },
                { v: ret.atTheDoor,     t: 'At the door' },
                { v: ret.grand,         t: 'Grand total' },
                { v: ret.transferred,   t: 'Transferred' },
                { v: ret.void,          t: 'Void' }
            ];
            o.lines.forEach(function (r) {
                body.push(tr(td(r.v||0, {className: 'Count'}), td(r.t)));
            });
            cb(body);
        }
    );
};

ReportSummary.prototype.title = 'Reports';

ReportSummary.prototype.label = function () {
    var o = this;
    Printers.getPrinter(cfg.label, gotPrinter, function () {});

    function gotPrinter(p) {
        // Check for printing disabled.
        if (!p) {
            return;
        }

        var toppx = 0;
        var bottompx = p.vertres;
        var leftpx = 0;
        var rightpx = p.horzres;

        var size = 10;    // Points
        var column = 1/3; // Fraction of label
        var gutter = 4;   // Points
        var col1 = 2;     // inset of column break as multiple of size

        var columnpx = p.xfract(column);
        var gutterpx = p.points(gutter);
        var sizepx = p.points(size);
        var col1px = col1 * sizepx;

        var xpx = leftpx;
        var ypx = toppx;
        var items = [];

        items.push({font: cfg.font, size:sizepx});

        o.lines.forEach(function (r) {
            ypx += sizepx;
            if (ypx > bottompx) {
                ypx = toppx + sizepx;
                xpx += columnpx;
            }
            items.push({ x: xpx+col1px, y: ypx, halign: 'right', text: r.v||0 });
            items.push({ x: xpx+col1px+gutterpx, y: ypx, halign: 'left', text: r.t });
        });
        p.print(items, function () { });
    }
};
