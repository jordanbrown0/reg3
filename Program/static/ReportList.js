var reportListSchema = [[
    {
        title: 'Filter ...'
    },
    {
        field: 'filter',
        label: 'Filter',
        input: InputFilter,
        required: false
    },
]];

function ReportListSetup()
{
    var o = this;
    DElement.call(o, 'div');
}
extend(DElement, ReportListSetup);

ReportListSetup.prototype.activate = function () {
    var o = this;
    var r = Editor.defaults(reportListSchema);
    var e = new Editor(r, {
        schema: reportListSchema,
        done: function () { base.switchTo(new ReportList(r)); },
        doneButton: 'Go',
        cancel: home
    });
    o.appendChild(e);
    e.activate();
};

ReportListSetup.prototype.title = 'Membership List';

function ReportList(params)
{
    var o = this;
    o.params = params;
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
    var listParams = {
        filter: Filter.compile(o.params.filter)
    };
    table.members.list(listParams, function (recs) {
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

ReportList.prototype.title = 'Membership List';
