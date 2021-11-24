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

        function line(title, count) {
            body.push(tr(
                td(count || '', {className: 'Count'}),
                td(title)
            ));
        }

        function total(title, count) {
            body.push(tr(
                { className: 'Total' },
                td(count, {className: 'Count'}),
                td(title)
            ));
        }

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
                line(c.description, t);
                delete o.totals[c.code];
            });

        for (var code in o.totals) {
            var t = o.totals[code];
            bad += t;
            grand += t;
            line('Bad code "' + code + '"', t);
        }

        body.push(tr());

        total('Paid', paid);
        total('Free', free);
        total('Bad class', bad);
        total('Grand total', grand);
        total('Void', voidTotal);

        cb(body);
    }
};

ReportTallyByClass.prototype.header = function () {
    return (tr(th('Memberships by class', { colSpan: 2 })));
};

ReportTallyByClass.prototype.title = 'Reports';
