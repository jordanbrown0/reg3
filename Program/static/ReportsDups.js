var reportsDupsSchema = [[
    {
        field: 'sort',
        label: 'Sort fields',
        input: InputMulti,
        required: true,
        default: ['last', 'first'],
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
            { field: 'last', prefix: null },
            { field: 'first', prefix: 3 }
        ],
        params: {
            input: InputObject,
            schema: [
                { field: 'field', input: InputText },
                { field: 'prefix', input: InputInt }
            ]
        }
    }
]];

function ReportsDups()
{
    var o = this;
    DElement.call(o, 'div');
}
extend(DElement, ReportsDups);

ReportsDups.prototype.activate = function () {
    var o = this;
    var r = Editor.defaults(reportsDupsSchema);
    var e = new Editor(r, {
        schema: reportsDupsSchema,
        done: function () { base.switchTo(new ReportsDupsGo(r)); },
        doneButton: 'Go'
    });
    o.appendChild(e);
    e.activate();
};

ReportsDups.prototype.title = 'Possible Duplicates';

function ReportsDupsGo(params) {
    var o = this;
    o.params = params;
    DElement.call(o, 'div');
}
extend(DElement, ReportsDupsGo);

ReportsDupsGo.prototype.activate = function () {
    var o = this;

    base.addNav([
        { key: 'P', msg: 'Print', func: function () { window.print(); } },
        { key: 'Enter', msg: 'Done', func: home },
        { key: 'Escape', func: home }
    ]);

    var body = new DElement('tbody');

    var t = o.appendChild(
        new DElement('table',
            new DElement('thead',
                tr(
                    th('Last'),
                    th('First')
                )
            ),
            body,
            new DElement('tfoot',
                tr(
                    th('Last'),
                    th('First')
                )
            )
        )
    );

    var prev = {};
    table.members.list({sort: o.params.sort}, function (recs) {
        forEachArrayObject(recs, function (k, r) {
            if (maybeDup(prev, r)) {
                line(prev);
                line(r);
                body.appendChild(tr(td(new EntityNode('nbsp'))));
            }
            prev = r;
        });
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
        body.appendChild(tr(
            td(r.last || ''),
            td(r.first || ''),
            td(joinTruthy(
                [ r.addr1, r.addr2, r.city, r.state, r.postcode, r.country ],
                ' / '
            ))
        ));
    }
};

ReportsDupsGo.prototype.title = 'Possible Duplicates';
