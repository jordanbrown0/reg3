var fieldsSchema = [
    [
        { field: 'page', label: 'Page number', input: InputInt, minimum: 1,
            required: true },
        { field: 'title', label: 'Page title (if new)',  default: '',
            required: true },
        { field: 'fields',
            label: 'Fields',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    { field: 'field', hint: 'Field name',
                        input: InputText, required: true },
                    { field: 'label', hint: 'Label',
                        input: InputText, required: true },
                    { field: 'type', input: InputSelect, default: 'text',
                        options: {
                            text: 'Text',
                            number: 'Number',
                            boolean: 'Checkbox',
                            currency: 'Currency',
                            phone: 'Phone',
                            date: 'Date',
                            datetime: 'Date+Time'
                        }
                    }
                ]
            }
        }
    ],
];

function FieldManager() {
    var o = this;
    params = {
        table: table.fields,
        schema: fieldsSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Fields',
        titleEdit: 'Edit fields',
        titleAdd: 'New fields',
        helpEdit: 'FieldEdit',
        reconfig: true
    };
    FieldManager.sup.constructor.call(o, params);
}
extend(DBManager, FieldManager);

FieldManager.prototype.summarize = function (k, r) {
    return (tr(td(r.page), td(r.title)));
};

FieldManager.inputs = {
    text: InputText,
    number: InputInt,
    boolean: InputBool,
    currency: InputCurrency,
    phone: InputPhone,
    date: InputDate,
    datetime: InputDateTime
};

FieldManager.get = function (cb) {
    var ret = [];

    table.fields.list({}, got);

    function got(recs) {
        recs.forEach(function (k, r) {
            var fields = r.fields;
            if (fields) {
                fields.forEach(function (ent) {
                    if (ent.field) {
                        ent.field = ent.field.toLowerCase();
                    }
                    ent.custom = true;
                    // NEEDSWORK: you might think that this could be handled
                    // through the normal get/list-time defaulting, but it
                    // can't because these are buried inside an InputMulti and
                    // an InputObject, and it would need to know how to look
                    // inside the InputMulti to see the defaults for each
                    // entry.
                    if (ent.type == undefined) {
                        ent.type = 'text';
                    }
                    ent.input = FieldManager.inputs[ent.type];
                });
            }
            ret.push(r);
        });
        cb({schema: {members: ret}});
    }
};

function ReportSchema()
{
    var o = this;
    ReportSchema.sup.constructor.call(o);
}
extend(Report, ReportSchema);

ReportSchema.prototype.activate = function () {
    var o = this;
    ReportSchema.sup.activate.call(o);
};

ReportSchema.prototype.body = function (cb) {
    var o = this;

    var schema = Member.getSchema();
    var body = [];
    var pageNum = 0;
    var needHeader = true;
    function header() {
        body.push(tr(
            th('', {id: 'custom'}),
            th('Field name'),
            th('Type'),
            th('Label')
        ));
    }
    schema.forEach(
        function (page) {
            pageNum++;
            body.push(tr(td('Page '+pageNum, { colSpan: 100, id: 'pageNum' })));
            needHeader = true;
            page.forEach(
                function (entry) {
                    if (entry.title) {
                        body.push(tr(
                            td(entry.title, { colSpan: 100, id: 'title' })
                        ));
                        needHeader = true;
                    } else {
                        if (needHeader) {
                            header();
                            needHeader = false;
                        }
                        var input = entry.input || InputText;
                        body.push(tr(
                            td(entry.custom ? '*' : '', {id: 'custom'}),
                            td(entry.field),
                            td(input.typeString(entry)),
                            td(entry.label)
                        ));
                    }
                }
            );
        }
    );
    cb(body);
};

ReportSchema.prototype.title = 'Schema';

init.push(function fieldsInit() {
    table.fields = new DBTable(db.reg, 'fields',
        { schema: fieldsSchema }
    );
});
