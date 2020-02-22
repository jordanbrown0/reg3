function ReportSummary()
{
    var o = this;
    ReportSummary.sup.constructor.call(o);
}
extend(Report, ReportSummary);

ReportSummary.prototype.activate = function () {
    var o = this;
    base.addNav([
        { key: 'L', msg: 'Label', func: function () { o.label(); } },
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
        },
        function (ret) {
            ret.grand = (ret.warm||0) + (ret.noShow||0);
            cb([
                tr(td(ret.warm||0), td('Warm Bodies')),
                tr(td(ret.noShow||0), td('No show')),
                tr(td(ret.prereg||0), td('Preregistered')),
                tr(td(ret.atTheDoor||0), td('At the door')),
                tr(td(ret.grand), td('Grand total')),
                tr(td(ret.void||0), td('Void'))
            ]);
        }
    );
};

ReportSummary.prototype.title = 'Reports';

ReportSummary.prototype.label = function () {
    getReportPrinterInfo(gotInfo, function () {});
    function gotInfo(ret) {
        log('printer', ret.printer);
        log('caps', ret.caps);
        rpc.label_print(ret.printer, [
            { x: ret.caps.horzres/2, y: ret.caps.vertres/2, font: ret.cfg.font, size:ret.caps.dpix/2, text: 'Hello world' }
        ], function () {alert('printed');});

    }
};
