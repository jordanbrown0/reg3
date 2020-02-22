function ReportTallyPickedUpByDate()
{
    var o = this;
    ReportTallyPickedUpByDate.sup.constructor.call(o);
}
extend(Report, ReportTallyPickedUpByDate);

ReportTallyPickedUpByDate.prototype.header = function () {
    return (tr(th('Memberships picked up by date', { colSpan: 2 })));
};

ReportTallyPickedUpByDate.prototype.body = function (cb) {
    var o = this;
    
    table.members.reduce(
        { expr: 
            { addto: [ {left: [ {f: 'pickedup'}, 10 ]}, 1 ]}
        },
        gotTotals);

    function gotTotals(totals) {
        var body = [];
        var grand = 0;
        Object.keys(totals).sort().forEach(function (d) {
            body.push(tr(
                td(totals[d]),
                td(d || 'Not picked up')
            ));
            grand += totals[d];
        });

        body.push(tr(td(grand), td('Grand total')));
        
        cb(body);
    }
};

ReportTallyPickedUpByDate.prototype.title = 'Reports';
