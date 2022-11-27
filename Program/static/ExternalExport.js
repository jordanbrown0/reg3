// NEEDSWORK InputMulti mechanism to allow reordering fields.
var externalExportAddSchema = [
    [
        { field: 'description',
            label: 'Description',
            required: true
        },
        { field: 'table',
            label: 'Source table',
            input: InputTablePicker,
            // Default from the primary schema is used.
            required: true
        }
    ]
];

// This is the entry for the field picker, extracted out so that it can
// be patched to specify which table we're exporting.
// NEEDSWORK:  It is bothersome (but not harmful) that we patch a global
// rather than somehow carrying the information on a per-instance basis.
var externalExportFromSchemaEntry = {
    field: 'from',
    input: InputFieldPicker,
    required: true,
    // table will be patched in at load time.
};

var externalExportSchema = [
    [
        { field: 'description', label: 'Description', default: '', required: true },
        { field: 'table',
            label: 'Source table',
            input: InputTablePicker,
            default: 'members',
            readOnly: true
        },
        { field: 'type', label: 'File type', required: true,
            input: InputSelect,
            options: {
                // DBF: 'DBF - dBASE',
                CSVh: 'CSV - Comma Separated (Excel compatible), with headers',
                CSV: 'CSV - Comma Separated (Excel compatible)'
            }
        },
        { field: 'encoding', label: 'Encoding', required: true,
            input: InputSelect,
            default: 'utf8',
            options: {
                latin1: 'ASCII / ISO 8859-1 / ISO Latin 1',
                utf8: 'UTF-8'
            }
        },
    ],[
        { title: 'Field Map' },
        { field: 'map',
            label: 'Field map',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    externalExportFromSchemaEntry,
                    { field: 'to', hint: 'External name',
                        input: InputText, required: true },
                    // { field: 'conversion', input: InputSelect,
                        // options: {
                            // '': '',
                            // number: 'Number',
                            // datev2: 'Reg v2 date',
                            // dateMS: 'Member Solutions date'
                        // }
                    // }
                ]
            }
        }
    ],[
        { title: 'Filter' },
        { field: 'filter', input: InputFilter }
    ]
];

// ExternalExportAdd is the first step in adding an export map.
// It collects the description and table, patches the schema so
// that the field selector uses the right table, and then hands
// it off to the generic DBAdd.
function ExternalExportAdd(r, params) {
    var o = this;
    o.orig_params = params;
    params = Object.assign({}, params, {
        schema: externalExportAddSchema,
        doneButton: 'Continue',
        done: function () {
            externalExportFromSchemaEntry.table = o.r.table;
            base.switchTo(new DBAdd(o.r, o.orig_params));
        }
    });
    ExternalExportAdd.sup.constructor.call(o, r, params);
}
extend(DBAdd, ExternalExportAdd);

// Subclass of DBEdit that intercepts retrieving the record and
// patches the edit schema so that the field selector uses the
// right table.
function ExternalExportEdit(k, params) {
    var o = this;
    ExternalExportEdit.sup.constructor.call(o, k, params);
}
extend(DBEdit, ExternalExportEdit);

ExternalExportEdit.prototype.get = function (cb) {
    var o = this;
    ExternalExportEdit.sup.get.call(o, function (r) {
        externalExportFromSchemaEntry.table = r.table;
        cb(r);
    });
};

function ExternalExportManager() {
    var o = this;
    var params = {
        table: table.externalExport,
        schema: externalExportSchema,
        canAdd: true,
        canDelete: true,
        canSaveCopy: true,
        titleManager: 'External Export',
        titleEdit: 'Edit export mapping',
        titleAdd: 'New export mapping'
    };
    ExternalExportManager.sup.constructor.call(o, params);
}
extend(DBManager, ExternalExportManager);

ExternalExportManager.prototype.summarize = function (k, r) {
    return (r.description);
};

ExternalExportManager.prototype.Add = ExternalExportAdd;
ExternalExportManager.prototype.Edit = ExternalExportEdit;

function ExternalExport()
{
    var o = this;
    ExternalExport.sup.constructor.call(o, 'div');
}
extend(DElement, ExternalExport);

ExternalExport.prototype.activate = function () {
    var o = this;

    var schema = [[
        {
            field: 'map',
            label: 'Export map',
            input: InputDBPicker,
            table: 'externalExport',
            textField: 'description',
            required: true
        }
    ]];
    var options = Editor.defaults(schema);
    var editor = new Editor(options, {
        schema: schema,
        doneButton: 'Export',
        done: function () {
            o.export(options);
        },
        cancel: home
    });
    o.appendChild(editor);
    editor.activate();
};

ExternalExport.prototype.export = function (r) {
    var o = this;
    table.externalExport.get(r.map, function (rMap) {
        rMap.map.forEach(function (e) {
            e.from = e.from.toLowerCase();
        });
        if (rMap.filter) {
            rMap.filter = Filter.compile(rMap.filter);
        }

        var t = table[rMap.table];
        t.externalExport(rMap, home);
    });
};

ExternalExport.prototype.title = 'External export...';

function ReportExportMappings()
{
    var o = this;
    ReportExportMappings.sup.constructor.call(o);
}
extend(Report, ReportExportMappings);

ReportExportMappings.prototype.activate = function () {
    var o = this;
    ReportExportMappings.sup.activate.call(o);
};

ReportExportMappings.prototype.body = function (cb) {
    var o = this;
    var first = true;

    table.externalExport.list({}, function (recs) {
        var body = [];
        recs.forEach(function (k, exp) {
            if (first) {
                first = false;
            } else {
                body.push(tr(td({className: 'Separator1'})));
            }
            var t = new DElement('table',
                tr(
                    td(
                        {className: 'Description', colSpan: 2},
                        exp.description
                    )
                ),
                tr(
                    td('Table'),
                    td(exp.table)
                ),
                tr(
                    td('Type'),
                    td(exp.type)
                ),
                tr(
                    td('Encoding'),
                    td(exp.encoding)
                )
            );
            body.push(tr(td(t)));

            body.push(tr(td({className: 'Separator2'})));

            var fieldMappings = new DElement('table');
            fieldMappings.appendChild(tr(
                th('Field Mappings', {colSpan: 3})
            ));
            fieldMappings.appendChild(tr(
                th('Reg3'),
                th('External')
            ));
            exp.map.forEach(function (fld) {
                fieldMappings.appendChild(tr(
                    td(fld.from),
                    td(fld.to)
                ));
            });
            body.push(tr(td(fieldMappings)));
        });
        cb(body);
    });
};

ReportExportMappings.prototype.title = 'External Export Mappings';

init.push(function externalExportInit() {
    table.externalExport = new DBTable(db.reg, 'externalExport',
        { schema: externalExportSchema }
    );
});
