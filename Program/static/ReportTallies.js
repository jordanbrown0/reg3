function ReportTallies()
{
    var o = this;
    ReportTallies.sup.constructor.call(o, {
        items: [
            { label: '&Summary', page: ReportSummary },
            { label: '&Geographic', func: function () {
                base.switchTo(new ReportTally({
                    expr: {
                        if: [
                            { or: [ {f: 'country'}, {f: 'state'} ] },
                            { join: [ ', ',
                                { or: [ {f: 'country'}, 'USA' ] },
                                {f: 'state'}
                            ]},
                            ''
                        ]
                    },
                    emptyTitle: 'Unknown',
                    header: 'Memberships by Geography',
                    help: 'ReportTalliesGeographic'
                })); }
            },
            { label: '&Picked up', page: ReportTallyPickedUp },
            { label: '&New', page: ReportTallyNew },
            { label: 'by &Class', page: ReportTallyByClass }
        ]
    });
}
extend(MenuPage, ReportTallies);

ReportTallies.prototype.title = 'Tallies of members';

function ReportTallyPickedUp()
{
    var o = this;
    ReportTallyPickedUp.sup.constructor.call(o, {
        items: [
            { label: '&Date', func: function () {
                base.switchTo(new ReportTally({
                    expr: {left: [ {f: 'pickedup'}, 10 ]},
                    emptyTitle: 'Not picked up',
                    notEmptyTitle: 'Total picked up',
                    header: 'Memberships picked up by date'
                }));
            }},
            { label: '&Hour', func: function () {
                base.switchTo(new ReportTally({
                    expr: {left: [ {f: 'pickedup'}, 13 ]},
                    emptyTitle: 'Not picked up',
                    notEmptyTitle: 'Total picked up',
                    header: 'Memberships Picked Up by Hour'
                }));
            }}
        ]
    });
}
extend(MenuPage, ReportTallyPickedUp);

ReportTallyPickedUp.prototype.title = 'Tally of Memberships Picked Up by ...';

function ReportTallyNew()
{
    var o = this;
    ReportTallyNew.sup.constructor.call(o, {
        items: [
            { label: '&Date', func: function () {
                base.switchTo(new ReportTally({
                    expr: {left: [ {f: 'entered'}, 10 ]},
                    emptyTitle: 'unknown',
                    header: 'New Memberships by Date'
                }));
            }},
            { label: 'Date and Class', func: function () {
                base.switchTo(new ReportTally({
                    expr: {
                        concat: [
                            { left: [ {f: 'entered'}, 10 ] },
                            ' ',
                            {f: 'class'}
                        ]
                    },
                    emptyTitle: 'unknown',
                    header: 'New Memberships by Date and Class'
                }));
            }},
            { label: '&Hour', func: function () {
                base.switchTo(new ReportTally({
                    expr: {left: [ {f: 'entered'}, 13 ]},
                    emptyTitle: 'unknown',
                    header: 'New Memberships by Hour'
                }));
            }}
        ]
    });
}
extend(MenuPage, ReportTallyNew);

ReportTallyNew.prototype.title = 'Tally of New Memberships by ...';

function ReportTally(params)
{
    var o = this;
    o.headerStr = params.header;
    o.expr = params.expr;
    o.emptyTitle = params.emptyTitle;
    o.notEmptyTitle = params.notEmptyTitle;
    o.help = params.help;
    ReportTally.sup.constructor.call(o);
}
extend(Report, ReportTally);

ReportTally.prototype.header = function () {
    var o = this;
    return (tr(th(o.headerStr, { colSpan: 2 })));
};

ReportTally.prototype.body = function (cb) {
    var o = this;

    table.members.reduce(
        { expr:
            { if: [
                { f: 'transferto' },
                { addto: ['transferred', 1] },
                { if: [
                    { f: 'void' },
                    { addto: [ 'void', 1 ] },
                    { addto: [ o.expr, 1 ] }
                ]}
            ]}
        },
        gotTotals);

    function gotTotals(totals) {
        var body = [];
        var grandTotal = 0;
        var notEmptyTotal = 0;
        var voidTotal = totals.void;
        delete totals.void;
        var transferredTotal = totals.transferred;
        delete totals.transferred;
        var collator =
            new Intl.Collator(undefined, { sensitivity: 'base' }).compare;
        Object.keys(totals).sort(collator).forEach(function (d) {
            body.push(tr(
                td(totals[d], {className: 'Count'}),
                td(d || o.emptyTitle)
            ));
            if (d) {
                notEmptyTotal += totals[d];
            }
            grandTotal += totals[d];
        });

        if (o.notEmptyTitle) {
            body.push(tr(
                {className: 'Total'},
                td(notEmptyTotal, {className: 'Count'}),
                td(o.notEmptyTitle)
            ));
        }
        body.push(tr(
            {className: 'Total'},
            td(grandTotal, {className: 'Count'}),
            td('Grand total')
        ));
        if (voidTotal) {
            body.push(tr(
                td(voidTotal, {className: 'Count'}),
                td('Void')
            ));
        }
        if (transferredTotal) {
            body.push(tr(
                td(transferredTotal, {className: 'Count'}),
                td('Transferred')
            ));
        }

        cb(body);
    }
};

ReportTally.prototype.title = 'Reports';
