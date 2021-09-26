var externalImportSchema = [
    [
        { field: 'description', label: 'Description', default: '', required: true },
        { field: 'table',
            label: 'Destination table',
            input: InputTablePicker,
            required: true
        },
        { field: 'type', label: 'File type', required: true,
            input: InputSelect,
            options: {
                DBF: 'DBF - dBASE',
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
                    { field: 'conversion', input: InputSelect,
                        options: {
                            '': '',
                            number: 'Number',
                            datev2: 'Reg v2 date',
                            mmddyyyy: 'mm/dd/yyyy or mm/dd/yy date',
                            ddmmyyyy: 'dd/mm/yyyy or dd/mm/yy date',
                            dateMS: 'Member Solutions date'
                        }
                    }
                ]
            }
        }
    ],[
        { title: 'Class Map' },
        { field: 'classMap',
            label: 'Class map',
            input: InputMulti,
            default: [],
            params: {
                input: InputObject,
                schema: [
                    { field: 'from', input: InputText, required: true },
                    { field: 'to', input: InputClass, required: true }
                ]
            }
        }
    ]
];

function ExternalImportManager() {
    var o = this;
    params = {
        table: table.externalImport,
        schema: externalImportSchema,
        canAdd: true,
        canDelete: true,
        canSaveCopy: true,
        titleManager: 'External Import',
        titleEdit: 'Edit import mapping',
        titleAdd: 'New import mapping'
    };

    ExternalImportManager.sup.constructor.call(o, params);
}
extend(DBManager, ExternalImportManager);

ExternalImportManager.prototype.summarize = function (k, r) {
    return (r.description);
};

function ExternalImport()
{
    var o = this;
    ExternalImport.sup.constructor.call(o, 'div');
}
extend(DElement, ExternalImport);

ExternalImport.prototype.activate = function () {
    var o = this;

    var schema = [[
        {
            field: 'file',
            input: InputFile,
            label: 'Import from file',
            required: true
        },
        {
            field: 'map',
            label: 'Import map',
            input: InputDBPicker,
            table: 'externalImport',
            textField: 'description',
            required: true
        },
        {
            field: 'zap',
            label: 'Zap table first?',
            input: InputBool
        }
    ]];
    var options = {}
    var editor = new Editor(options, {
        schema: schema,
        doneButton: 'Import',
        done: function () {
            o.import(options);
        },
        cancel: home
    });
    o.appendChild(editor);
    editor.activate();
};

ExternalImport.prototype.import = function (r) {
    var o = this;
    table.externalImport.get(r.map, function (rMap) {
        var classMap = {};
        rMap.classMap.forEach(function (e) {
            classMap[e.from] = e.to;
        });
        rMap.contentMap = { 'class': classMap };
        delete rMap.classMap;

        rMap.map.forEach(function (e) {
            e.to = e.to.toLowerCase();
        });

        var t = table[rMap.table];
        if (r.zap) {
            t.zap(doImport);
        } else {
            doImport();
        }
        function doImport() {
            t.externalImport(r.file, rMap, function () {
                modal("Import complete", { ok: home });
            });
        }
    });
};

ExternalImport.prototype.title = 'External import...';

init.push(function externalImportInit() {
    table.externalImport = new DBTable(db.reg, 'externalImport',
        { defaults: Editor.defaults(externalImportSchema) }
    );
});