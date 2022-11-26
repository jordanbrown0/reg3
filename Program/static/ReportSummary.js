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
                { f: 'transferto' },
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
                        ]},
                        { if: [
                            { f: 'amount' },
                            { addto: [ 'paid', 1 ]},
                            { addto: [ 'free', 1 ]}
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
                { v: ret.paid,          t: 'Paid' },
                { v: ret.free,          t: 'Free' },
                { v: ret.grand,         t: 'Grand total', c: 'Total' },
                { v: ret.transferred,   t: 'Transferred' },
                { v: ret.void,          t: 'Void' }
            ];
            o.lines.forEach(function (r) {
                var line = tr(
                    td(r.v||0, { className: 'Count' }),
                    td(r.t)
                );
                if (r.c) {
                    line.setProperties({ className: r.c });
                }
                body.push(line);
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

        var toppx = p.limits.y - p.limits.v + 1;
        var bottompx = p.limits.y;
        var leftpx = p.limits.x;
        var rightpx = p.limits.x + p.limits.h - 1;

        var size = 10;    // Points
        var column = 80;  // Points
        var gutter = 4;   // Points
        var col1 = 25;     // inset of column break in points

        var columnpx = p.points(column);
        var gutterpx = p.points(gutter);
        var sizepx = p.points(size);
        var col1px = p.points(col1);

        var xpx = leftpx;
        var ypx = toppx;
        var items = [];

        items.push({font: cfg.font, size:sizepx});

        items.push({ x: rightpx, y: bottompx - sizepx, halign: 'right',
            text: o.time.toDisplayDate() });
        items.push({ x: rightpx, y: bottompx, halign: 'right',
            text: o.time.toDisplayTime({seconds: false}) });

        o.lines.forEach(function (r) {
            ypx += sizepx;
            if (ypx > bottompx) {
                ypx = toppx + sizepx - 1;
                xpx += columnpx;
            }
            items.push({ x: xpx+col1px, y: ypx, halign: 'right', text: r.v||0 });
            items.push({ x: xpx+col1px+gutterpx, y: ypx, halign: 'left', text: r.t });
        });
        p.print(items, function () { });
    }
};
