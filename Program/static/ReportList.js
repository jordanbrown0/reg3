function ReportList()
{
    var o = this;
    ReportList.sup.constructor.call(o, 'div');
}
extend(Report, ReportList);

ReportList.prototype.header = function () {
    var o = this;
    return (tr(
            th('Last'),
            th('First'),
            th('Address')
        )
    );
};
ReportList.prototype.footer = function () {
    var o = this;
    return (tr(
            th('Last'),
            th('First'),
            th('Address')
        )
    );
};

ReportList.prototype.body = function (cb) {
    var o = this;
    var body = [];
    table.members.list({sort: ['last', 'first']}, function (recs) {
        forEachArrayObject(recs, function (k, r) {
            body.push(tr(
                td(r.last || ''),
                td(r.first || ''),
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
