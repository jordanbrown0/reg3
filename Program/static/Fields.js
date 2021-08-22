var fieldsSchema = [
    [
        { field: 'page',
            label: 'Page number',
            input: InputInt,
            required: true
        },
        { field: 'title', label: 'Page title', default: '', required: true },
        { field: 'fields',
            label: 'Fields',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    { field: 'field', input: InputText, required: true },
                    { field: 'label', input: InputText, required: true }
                ]
            }
        }
    ],
];

function FieldsManager() {
    var o = this;
    params = {
        table: table.fields,
        schema: fieldsSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Fields',
        titleEdit: 'Edit fields',
        titleAdd: 'New fields',
        reconfig: true
    };
    FieldsManager.sup.constructor.call(o, params);
}
extend(DBManager, FieldsManager);

FieldsManager.prototype.summarize = function (k, r) {
    return (tr(td(r.page), td(r.title)));
};

FieldsManager.get = function (cb) {
    var ret = [];
    
    table.fields.list({}, got);
    
    function got(recs) {
        recs.forEach(function (k, r) {
            ret.push(r);
        });
        cb({schema: {members: ret}});
    }
};

init.push(function fieldsInit() {
    table.fields = new DBTable(db.reg, 'fields',
        { defaults: Editor.defaults(fieldsSchema) }
    );
});
