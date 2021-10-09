// NEEDSWORK InputMulti mechanism to allow reordering fields.
var externalExportSchema = [
    [
        { field: 'description', label: 'Description', default: '', required: true },
        { field: 'table',
            label: 'Source table',
            input: InputTablePicker,
            required: true
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
                    { field: 'from', input: InputText, required: true },
                    { field: 'to', input: InputText, required: true },
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
    ]
];

function ExternalExportManager() {
    var o = this;
    params = {
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
    var options = {}
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
        var t = table[rMap.table];
        t.externalExport(rMap, home);
    });
};

ExternalExport.prototype.title = 'External export...';

init.push(function externalExportInit() {
    table.externalExport = new DBTable(db.reg, 'externalExport',
        { schema: externalExportSchema }
    );
});
