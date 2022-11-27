function Zap()
{
    var o = this;
    Zap.sup.constructor.call(o, 'div');
}
extend(DElement, Zap);

Zap.prototype.activate = function () {
    var o = this;

    var schema = [[
        {
            field: 'table',
            label: 'Table to zap',
            input: InputTablePicker,
            required: true
        }
    ]];
    var options = {}
    var editor = new Editor(options, {
        schema: schema,
        cancel: home
    });

    base.addNav([{
        label: 'Zap',
        order: 1,
        func: function () {
            if (editor.get()) {
                o.zap(options);
            }
        }
    }]);

    o.appendChild(editor);
    editor.activate();
};

Zap.prototype.zap = function (options) {
    var o = this;
    table[options.table].zap(home);
};

Zap.prototype.title = 'Zap a table...';
