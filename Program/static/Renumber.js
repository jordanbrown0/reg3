function Renumber()
{
    var o = this;
    Renumber.sup.constructor.call(o, 'div');
}
extend(DElement, Renumber);

Renumber.prototype.activate = function () {
    var o = this;

    var schema = [[
        {
            field: 'start',
            input: InputInt,
            label: 'Start at number'
        },
        {
            field: 'all',
            label: 'Renumber all members?',
            input: InputBool
        }
    ]];
    var options = {}
    var editor = new Editor(options, {
        schema: schema,
        doneButton: 'Renumber',
        done: function () {
            if (options.start) {
                options.start--;
                o.renumber(options);
            } else {
                table.members.reduce({
                    expr: {
                        if: [
                            { gt: [ { f: 'number' }, { get: 'highest' } ] },
                            { set: [ 'highest', { f: 'number' } ] }
                        ]
                    }
                }, function (ret) {
                    options.start = ret.highest || 0;
                    o.renumber(options);
                });
            }
        },
        cancel: home
    });
    o.appendChild(editor);
    editor.activate();
};

Renumber.prototype.renumber = function (options) {
    var o = this;
    var expr = { setf: [ 'number', { addto: [ 'start', 1 ] } ] };
    if (!options.all) {
        expr = { if: [ { not: { f: 'number' } }, expr ] };
    }
    table.members.reduce({
        expr: expr,
        init: { start: options.start }
    }, function (ret) { home(); });
};

Renumber.prototype.title = 'Renumber...';
