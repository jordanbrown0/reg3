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
                CSV: 'CSV - Comma Separated (Excel compatible)'
            }
        },
        { field: 'map',
            label: 'Field map',
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

function ExternalImportManager() {
    var o = this;
    params = {
        table: table.externalImport,
        schema: externalImportSchema,
        canAdd: true,
        canDelete: true,
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
    
    db.reg.listTables(function (tables) {
        var schema = [[
            {
                field: 'file',
                input: InputText,
                label: 'Import from server file',
                required: true
            },
            {
                field: 'map',
                label: 'Import map',
                input: InputDBPicker,
                table: 'externalImport',
                textField: 'description',
                required: true
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
    });
};

ExternalImport.prototype.import = function (r) {
    var o = this;
    table.externalImport.get(r.map, function (rMap) {
        var map = {};
        rMap.map.forEach(function (mapEnt) {
            map[mapEnt.from] = mapEnt.to;
        });
        table[rMap.table].externalImport(r.file, rMap.type, map, home);
    });
};

ExternalImport.prototype.title = 'External import...';

init.push(function externalImportInit() {
    table.externalImport = new DBTable(db.reg, 'externalImport',
        { defaults: Editor.defaults(externalImportSchema) }
    );
});
