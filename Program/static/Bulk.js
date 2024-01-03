var bulkOps = {
    replaceRE: {
        schema: [[
            { field: 'description', label: 'Description', default: '', required: true },
            { field: 'filter', label: 'Filter', input: InputFilter },
            { field: 'replacements',
                label: 'What to replace',
                input: InputMulti,
                default: [],
                params: {
                    input: InputObject,
                    schema: [
                        {
                            field: 'field',
                            input: InputFieldPicker,
                            required: true,
                            table: 'members'
                        },
                        { field: 'replace', hint: 'Replace RE',
                            input: InputText, required: true },
                        { field: 'with', hint: 'With',
                            input: InputText, required: true },
                    ]
                }
            }
        ]],
        titleEdit: 'Edit bulk replace regular expression',
        titleAdd: 'New bulk replace regular expression',
        genProgram: function (r) {
            var ret = [];
            r.replacements.forEach(function (rep) {
                ret.push({ setf: [
                    rep.field,
                    { replaceRE: [ { f: rep.field }, rep.replace, rep.with ] }
                ]});
            });
            return (ret);
        },
    },
    delete: {
        schema: [[
            { field: 'description', label: 'Description', default: '', required: true },
            { field: 'filter', label: 'Filter', input: InputFilter },
        ]],
        titleEdit: 'Edit bulk delete',
        titleAdd: 'New bulk delete',
        genProgram: function (r) {
            return ([{ delete: [] }]);
        },
    },
};

function BulkManager() {
    var o = this;
    var params = {
        table: table.bulk,
        canDelete: true,
        canSaveCopy: true,
        titleManager: 'Bulk Operations',
        titleEdit: 'Edit bulk operation (replace this)',
        titleAdd: 'New bulk operation (replace this)'
    };
    BulkManager.sup.constructor.call(o, params);
}
extend(DBManager, BulkManager);

BulkManager.prototype.activate = function () {
    var o = this;
    BulkManager.sup.activate.call(o);
    base.addNav([
        { label: 'ReplaceRE', func: function () { o.add('replaceRE'); } },
        { label: 'Delete', func: function () { o.add('delete'); } }
    ]);
}

BulkManager.prototype.summarize = function (k, r) {
    return (r.description);
};

BulkManager.prototype.add = function (type) {
    var o = this;
    var params = Object.assign({}, o.params, {
        help: o.params.helpAdd || o.params.helpEdit,
        schema: bulkOps[type].schema,
        titleAdd: bulkOps[type].titleAdd,
    });
    base.switchTo(new DBAdd({type: type}, params));
};

BulkManager.prototype.pick = function (k, r) {
    var o = this;
    var params = Object.assign({}, o.params, {
        help: o.params.helpEdit,
        schema: bulkOps[r.type].schema,
        titleEdit: bulkOps[r.type].titleEdit,
    });
    base.switchTo(new o.Edit(k, params));
};

// Maybe this should be a button on the Add/Edit page.
// That would allow for ephemeral bulk ops.
// But it would need to switch back to that original Add/Edit page,
// without losing context.
function BulkRunner()
{
    var o = this;
    ExternalExport.sup.constructor.call(o, 'div');
}
extend(DElement, BulkRunner);

BulkRunner.prototype.activate = function () {
    var o = this;

    var schema = [[
        {
            field: 'op',
            label: 'Operation',
            input: InputDBPicker,
            table: 'bulk',
            textField: 'description',
            required: true
        }
    ]];
    var options = Editor.defaults(schema);
    var editor = new Editor(options, {
        schema: schema,
        doneButton: 'Go',
        done: function () {
            o.run(options);
        },
        cancel: home
    });
    o.appendChild(editor);
    editor.activate();
};

// NEEDSWORK return a list of the changes made?
BulkRunner.prototype.run = function (r) {
    var o = this;
    table.bulk.get(r.op, function (rOp) {
        var program = bulkOps[rOp.type].genProgram(rOp);
        var params = {
            expr: { if: [
                    Filter.compile(rOp.filter),
                    { do: program },
                    null
            ]}
        };

        table.members.reduce(params, function (ret) { home(); });
    });
};

BulkRunner.prototype.title = 'Bulk operation...';

init.push(function bulkInit() {
    table.bulk = new DBTable(db.reg, 'bulk', {});
});
