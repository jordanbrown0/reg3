var reportListSchema = [[
    {
        title: 'All of ...'
    },
    {
        field: 'search',
        label: 'Search',
        input: InputText,
        required: false,
        default: '',
    },
    { field: 'categories', label: 'Categories (any of)', input: InputSelectMultiDB,
        default: [], table: 'categories', keyField: 'name', textField: 'description'},
    { field: 'classes', label: 'Classes (any of)', input: InputSelectMultiDB,
        default: [], table: 'classes', keyField: 'code', textField: 'description'}
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
    var filters = [];
    if (o.params.search) {
        filters.push({ match: o.params.search.split(' ') });
    }
    if (o.params.categories.length > 0) {
        filters.push({and: [
            {f: 'categories'},
            { overlaps: [ o.params.categories, { f: 'categories' } ]}
        ]});
    }
    if (o.params.classes.length > 0) {
        filters.push({ includes: [ o.params.classes, { f: 'class' } ]});
    }
    var listParams = {
        filter: { and: filters }
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
