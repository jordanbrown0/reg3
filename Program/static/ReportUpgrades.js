function ReportUpgrades()
{
    var o = this;
    ReportUpgrades.sup.constructor.call(o, 'div');
}
extend(Report, ReportUpgrades);

ReportUpgrades.prototype.header = function () {
    var o = this;
    return (tr(
            th('From'),
            th('To'),
            th('Amount'),
            th('Metaclass'),
            th('Description'),
            th('Start On'),
            th('End On')
        )
    );
};
ReportUpgrades.prototype.footer = ReportUpgrades.prototype.footer

ReportUpgrades.prototype.body = function (cb) {
    var o = this;
    table.upgrades.list({}, function (recs) {
        var body = [];
        recs.toArray()
            .sort(compareFunction(['from', 'to']))
            .forEach(function (r) {
                body.push(tr(
                    td(r.from || ''),
                    td(r.to || ''),
                    td(r.amount, {id: 'amount'}),
                    td(r.metaclass || '', {id: 'metaclass'}),
                    td(r.description || ''),
                    td(LDate.fromJSON(r.start).toDisplayDate(), {id: 'start'}),
                    td(LDate.fromJSON(r.end).toDisplayDate(), {id: 'end'})
                ));
            });
        cb(body);
    });
};
