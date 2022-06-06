var externalImportAddSchema = [
    [
        { field: 'description', label: 'Description', default: '', required: true },
        { field: 'table',
            label: 'Destination table',
            input: InputTablePicker,
            // Default from the primary schema is used.
            required: true
        }
    ]
];

// This is the entry for the field picker, extracted out so that it can
// be patched to specify which table we're importing into.
// NEEDSWORK:  It is bothersome (but not harmful) that we patch a global
// rather than somehow carrying the information on a per-instance basis.
var externalImportToSchemaEntry = {
    field: 'to',
    input: InputFieldPicker,
    required: true,
    // table will be patched in at load time.
};

var externalImportSchema = [
    [
        { field: 'description', label: 'Description', default: '', required: true },
        { field: 'table',
            label: 'Destination table',
            input: InputTablePicker,
            default: 'members',
            readOnly: true
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
        { field: 'key', label: 'Unique identifier field'}
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
                    externalImportToSchemaEntry,
                    { field: 'conversion', input: InputSelect,
                        options: {
                            '': '',
                            number: 'Number',
                            phone: 'Telephone number',
                            datev2: 'Reg v2 date',
                            mmddyyyy: 'mm/dd/yyyy or mm/dd/yy date',
                            ddmmyyyy: 'dd/mm/yyyy or dd/mm/yy date',
                            yyyymmdd: 'yyyy-mm-dd hh:mm:ss date',
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

// ExternalImportAdd is the first step in adding an import map.
// It collects the description and table, patches the schema so
// that the field selector uses the right table, and then hands
// it off to the generic DBAdd.
function ExternalImportAdd(r, params) {
    var o = this;
    o.orig_params = params;
    params = Object.assign({}, params, {
        schema: externalImportAddSchema,
        doneButton: 'Continue',
        done: function () {
            externalImportToSchemaEntry.table = o.r.table;
            base.switchTo(new DBAdd(o.r, o.orig_params));
        }
    });
    ExternalImportAdd.sup.constructor.call(o, r, params);
}
extend(DBAdd, ExternalImportAdd);

// Subclass of DBEdit that intercepts retrieving the record and
// patches the edit schema so that the field selector uses the
// right table.
function ExternalImportEdit(k, params) {
    var o = this;
    ExternalImportEdit.sup.constructor.call(o, k, params);
}
extend(DBEdit, ExternalImportEdit);

ExternalImportEdit.prototype.get = function (cb) {
    var o = this;
    ExternalImportEdit.sup.get.call(o, function (r) {
        externalImportToSchemaEntry.table = r.table;
        cb(r);
    });
};

function ExternalImportManager() {
    var o = this;
    var params = {
        table: table.externalImport,
        schema: externalImportSchema,
        canAdd: true,
        canDelete: true,
        canSaveCopy: true,
        titleManager: 'External Import',
        titleEdit: 'Edit import mapping',
        titleAdd: 'New import mapping',
        helpEdit: 'ExternalImportEdit'
    };

    ExternalImportManager.sup.constructor.call(o, params);
}
extend(DBManager, ExternalImportManager);

ExternalImportManager.prototype.summarize = function (k, r) {
    return (r.description);
};

ExternalImportManager.prototype.Add = ExternalImportAdd;
ExternalImportManager.prototype.Edit = ExternalImportEdit;

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
        { field: 'existing', label: 'Existing records',
            input: InputSelect,
            default: 'keep',
            options: {
                keep: 'Keep existing record',
                replace: 'Replace existing record',
                zap: 'Zap all existing records',
                add: 'Add duplicate'
            }
        }
    ]];
    var options = Editor.defaults(schema);
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

ExternalImport.prototype.import = function (options) {
    var o = this;
    table.externalImport.get(options.map, function (rMap) {
        var classMap = {};
        rMap.classMap.forEach(function (e) {
            classMap[e.from] = e.to;
        });
        rMap.contentMap = { 'class': classMap };
        delete rMap.classMap;

        rMap.map.forEach(function (e) {
            e.to = e.to.toLowerCase();
        });

        rMap.existing = options.existing;

        var t = table[rMap.table];
        t.externalImport(options.file, rMap, function (ret) {
            var content = div();
            if (options.existing == 'zap') {
                content.appendChild(div('Zapped all existing records.'));
            }
            if (ret.added) {
                content.appendChild(div(
                    'Added ' + ret.added + ' new records.'));
            }
            if (ret.replaced) {
                content.appendChild(div(
                    'Replaced ' + ret.replaced + ' existing records.'));
            }
            if (ret.kept) {
                content.appendChild(div(
                    'Kept ' + ret.kept + ' existing records.'));
            }
            modal(content, { ok: home });
        });
    });
};

ExternalImport.prototype.title = 'External import...';

init.push(function externalImportInit() {
    table.externalImport = new DBTable(db.reg, 'externalImport',
        { schema: externalImportSchema }
    );
});
