function ReportClasses()
{
    var o = this;
    ReportClasses.sup.constructor.call(o, 'div');
}
extend(Report, ReportClasses);

ReportClasses.prototype.header = function () {
    var o = this;
    return (tr(
            th('Code'),
            th('Description'),
            th('Amount'),
            th('Badge?'),
            th('Metaclasses'),
            th('On Badge'),
            th('Phone Label'),
            th('Order'),
            th('Start On'),
            th('End On')
        )
    );
};
ReportClasses.prototype.footer = ReportClasses.prototype.header;

ReportClasses.prototype.body = function (cb) {
    var o = this;
    table.classes.list({}, function (recs) {
        var body = [];
        recs.toArray()
            .sort(compareFunction(['order']))
            .forEach(function (r) {
                body.push(tr(
                    td(r.code || ''),
                    td(r.description || ''),
                    td(r.amount, {id: 'amount'}),
                    td(r.badgeOK ? 'Yes' : 'No', {id: 'badgeOK'}),
                    td((r.metaclasses || []).join(', '), {id: 'metaclasses'}),
                    td(r.onBadge || '', {id: 'onBadge'}),
                    td(r.phoneLabel ? 'Yes' : 'No', {id: 'phoneLabel'}),
                    td(r.order || '', {id: 'order'}),
                    td(LDate.fromJSON(r.start).toDisplayDate(), {id: 'start'}),
                    td(LDate.fromJSON(r.end).toDisplayDate(), {id: 'end'})
                ));
            });
        cb(body);
    });
};
