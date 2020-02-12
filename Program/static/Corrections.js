var correctionsSchema = [
    [
        { field: 'table',
            label: 'Table',
            input: InputTablePicker,
            required: true
        },
        { field: 'field', label: 'Field name', default: '', required: true },
        { field: 'corrections',
            label: 'Corrections',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    { field: 'from', input: InputText, required: true },
                    { field: 'to', input: InputText, required: true }
                ]
            }
        }
    ],
];

function CorrectionsManager() {
    var o = this;
    params = {
        table: table.corrections,
        schema: correctionsSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Corrections',
        titleEdit: 'Edit corrections',
        titleAdd: 'New corrections'
    };
    CorrectionsManager.sup.constructor.call(o, params);
}
extend(DBManager, CorrectionsManager);

CorrectionsManager.prototype.summarize = function (k, r) {
    return (tr(td(r.table), td(r.field)));
};

init.push(function correctionsInit() {
    table.corrections = new DBTable(db.reg, 'corrections',
        { defaults: Editor.defaults(correctionsSchema) }
    );
});
