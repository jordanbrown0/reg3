function ReportTallyByClass()
{
    var o = this;
    ReportTallyByClass.sup.constructor.call(o);
}
extend(Report, ReportTallyByClass);

ReportTallyByClass.prototype.body = function (cb) {
    var o = this;

    table.members.reduce(
        { expr:
            { if: [
                { f: 'void' },
                { addto: [ '', 1 ] },
                { addto: [ {f: 'class'}, 1 ] }
            ]}
        },
        gotTotals
    );

    function gotTotals(totals) {
        o.totals = totals;
        table.classes.list({}, gotClasses);
    }

    function gotClasses(classes) {
        var voidTotal = o.totals[''] || 0;
        delete o.totals[''];
        var body = [];

        var grand = 0;
        var paid = 0;
        var free = 0;
        var bad = 0;

        classes.toArray()
            .sort(compareFunction(['order']))
            .forEach(function (c) {
                var t = o.totals[c.code] || 0;
                grand += t;
                if (c.amount > 0) {
                    paid += t;
                } else {
                    free += t;
                }
                body.push(tr(
                    td(t || '', {className: 'Count'}),
                    td(c.description)
                ));
                delete o.totals[c.code];
            });

        for (var code in o.totals) {
            var t = o.totals[code];
            bad += t;
            body.push(tr(
                td(t, {className: 'Count'}),
                td('Bad code "' + code + '"')
            ));
        }

        body.push(tr());

        body.push(tr(
            { className: 'Total' },
            td(paid, {className: 'Count'}),
            td('Paid')
        ));
        body.push(tr(
            { className: 'Total' },
            td(free, {className: 'Count'}),
            td('Free')
        ));
        body.push(tr(
            { className: 'Total' },
            td(bad, {className: 'Count'}),
            td('Bad class')
        ));
        body.push(tr(
            { className: 'Total' },
            td(grand, {className: 'Count'}),
            td('Grand total')
        ));
        body.push(tr(
            { className: 'Total' },
            td(voidTotal, {className: 'Count'}),
            td('Void')
        ));

        cb(body);
    }
};

ReportTallyByClass.prototype.header = function () {
    return (tr(th('Memberships by class', { colSpan: 2 })));
};

ReportTallyByClass.prototype.title = 'Reports';
