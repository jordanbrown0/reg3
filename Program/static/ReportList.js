function ReportList()
{
    var o = this;
    ReportList.sup.constructor.call(o, 'div');
}
extend(Report, ReportList);

ReportList.prototype.header = function () {
    var o = this;
    return (tr(
            th('#', {id: 'number'}),
            th('Last'),
            th('First'),
            th('Address')
        )
    );
};

ReportList.prototype.footer = ReportList.prototype.header;

ReportList.prototype.body = function (cb) {
    var o = this;
    table.members.list({}, function (recs) {
        var body = [];
        recs.toArray()
            .sort(compareFunction(['lname', 'fname']))
            .forEach(function (r) {
                body.push(tr(
                    td(r.number || '', {id: 'number'}),
                    td(r.lname || ''),
                    td(r.fname || ''),
                    td(joinTruthy(
                        [ r.addr1, r.addr2, r.city, r.state, r.postcode, r.country ],
                        ' / '
                    ))
                ));
            });
        cb(body);
    });
};

ReportList.prototype.title = 'Reports';
