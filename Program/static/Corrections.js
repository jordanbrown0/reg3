var correctionsSchema = [
    [
        { field: 'table',
            label: 'Table',
            input: InputText,
            default: 'members',
            hidden: true
        },
        { field: 'field',
            label: 'Field name',
            input: InputFieldPicker,
            table: 'members',
            default: '',
            required: true
        },
        { field: 'corrections',
            label: 'Corrections',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    { field: 'from', hint: 'From',
                        input: InputText, required: true },
                    { field: 'to', hint: 'To',
                        input: InputText, required: true }
                ]
            }
        }
    ],
];

function CorrectionManager() {
    var o = this;
    params = {
        table: table.corrections,
        schema: correctionsSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Corrections',
        titleEdit: 'Edit corrections',
        titleAdd: 'New corrections',
        helpEdit: 'CorrectionEdit',
        reconfig: true
    };
    CorrectionManager.sup.constructor.call(o, params);
}
extend(DBManager, CorrectionManager);

CorrectionManager.prototype.summarize = function (k, r) {
    return (tr(td(r.field)));
};

CorrectionManager.get = function(cb) {
    var corrections = {};

    table.corrections.list({}, got);

    function got(recs) {
        recs.forEach(function (k, cr) {
            var table = cr.table;
            if (!corrections[table]) {
                corrections[table] = {};
            }
            var ct = corrections[table];
            var field = cr.field;
            if (!ct[field]) {
                ct[field] = {};
            }
            var ctf = ct[field];
            cr.corrections.forEach(function (c) {
                ctf[c.from.toLowerCase()] = c.to;
            });
        });
        cb({corrections: corrections});
    }
};

init.push(function correctionsInit() {
    table.corrections = new DBTable(db.reg, 'corrections',
        { schema: correctionsSchema }
    );
});
