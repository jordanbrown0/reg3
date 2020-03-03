function ReportTallyNewByDate()
{
    var o = this;
    ReportTallyNewByDate.sup.constructor.call(o);
}
extend(Report, ReportTallyNewByDate);

ReportTallyNewByDate.prototype.header = function () {
    return (tr(th('New memberships by date', { colSpan: 2 })));
};

ReportTallyNewByDate.prototype.body = function (cb) {
    var o = this;
    
    table.members.reduce(
        { expr: 
            { addto: [ {left: [ {f: 'entered'}, 10 ]}, 1 ]}
        },
        gotTotals);

    function gotTotals(totals) {
        var body = [];
        var grand = 0;
        var prereg = 0;
        var atTheDoor = 0;
        Object.keys(totals).sort().forEach(function (d) {
            body.push(tr(
                td(totals[d], {className: 'Count'}),
                td(d || '(no date)')
            ));
            grand += totals[d];
            if (d >= cfg.startDate) {
                atTheDoor += totals[d];
            } else {
                prereg += totals[d];
            }
        });

        body.push(tr(
            { className: 'Total' },
            td(prereg, {className: 'Count'}),
            td('Preregistered')
        ));
        body.push(tr(
            { className: 'Total'},
            td(atTheDoor, {className: 'Count'}),
            td('At the door')
        ));
        body.push(tr(
            { className: 'Total' },
            td(grand, {className: 'Count'}),
            td('Grand total')
        ));
        cb(body);
    }
};

ReportTallyNewByDate.prototype.title = 'Reports';
