var reportDupsSchema = [[
    {
        field: 'sort',
        label: 'Sort fields',
        input: InputMulti,
        required: true,
        default: ['lname', 'fname'],
        params: {
            input: InputText,
            required: true
        }
    },
    {
        field: 'compare',
        label: 'Compare fields',
        input: InputMulti,
        required: true,
        default: [
            { field: 'lname', prefix: null },
            { field: 'fname', prefix: 3 }
        ],
        params: {
            input: InputObject,
            schema: [
                { field: 'field', input: InputText },
                { field: 'prefix', input: InputInt, minimum: 1 }
            ]
        }
    }
]];

function ReportDupsSetup()
{
    var o = this;
    DElement.call(o, 'div');
}
extend(DElement, ReportDupsSetup);

ReportDupsSetup.prototype.activate = function () {
    var o = this;
    var r = Editor.defaults(reportDupsSchema);
    var e = new Editor(r, {
        schema: reportDupsSchema,
        done: function () { base.switchTo(new ReportDups(r)); },
        doneButton: 'Go',
        cancel: home
    });
    o.appendChild(e);
    e.activate();
};

ReportDupsSetup.prototype.title = 'Possible Duplicates';

function ReportDups(params) {
    var o = this;
    o.params = params;
    ReportDups.sup.constructor.call(o);
}
extend(Report, ReportDups);

ReportDups.prototype.header = function () {
    return (tr(
        th('Last'),
        th('First'),
        th('Address')
    ));
};

ReportDups.prototype.footer = function () {
    return (tr(
        th('Last'),
        th('First'),
        th('Address')
    ));
};

ReportDups.prototype.body = function (cb) {
    var o = this;

    var body = [];
    var prev = {};
    var first = true;
    table.members.list({}, function (recs) {
        var body = [];
        recs.toArray()
            .sort(compareFunction(o.params.sort))
            .forEach(function (r) {
                if (maybeDup(prev, r)) {
                    if (!first) {
                        body.push(tr(td(new EntityNode('nbsp'))));
                    }
                    body.push(line(prev));
                    body.push(line(r));
                    first = false;
                }
                prev = r;
            });
        cb(body);
    });

    function maybeDup(r1, r2) {
        return (o.params.compare.every(function (ent) {
            var a = r1[ent.field];
            var b = r2[ent.field];
            a = (a == null) ? '' : a.toString();
            b = (b == null) ? '' : b.toString();
            if (ent.prefix) {
                a = a.slice(0, ent.prefix);
                b = b.slice(0, ent.prefix);
            }
            return (a == b);
        }));
    }
    function line(r) {
        return(tr(
            td(r.lname || ''),
            td(r.fname || ''),
            td(joinTruthy(
                [ r.addr1, r.addr2, r.city, r.state, r.zip, r.country ],
                ' / '
            ))
        ));
    }
};

ReportDups.prototype.title = 'Possible Duplicates';
