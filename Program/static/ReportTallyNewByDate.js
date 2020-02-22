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
        Object.keys(totals).sort().forEach(function (d) {
            body.push(tr(
                td(totals[d]),
                td(d || 'Preregistered')
            ));
            grand += totals[d];
        });

        body.push(tr(td(grand), td('Grand total')));
        cb(body);
    }
};

ReportTallyNewByDate.prototype.title = 'Reports';
