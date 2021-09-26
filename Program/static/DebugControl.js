var debugControlSchema = [[
    { field: 'rpc', label: 'RPC', input: InputBool },
    { field: 'keyboard', label: 'Keyboard', input: InputBool },
    { field: 'dom', label: 'DOM', input: InputBool },
    { field: 'config', label: 'Config', input: InputBool }
]];

function DebugControl()
{
    var o = this;
    DebugControl.sup.constructor.call(o, 'div');
}
extend(DElement, DebugControl);

DebugControl.prototype.activate = function () {
    var o = this;
    var e = new Editor(debug, {
        schema: debugControlSchema,
        done: home,
        doneButton: 'Go',
        cancel: home
    });
    o.appendChild(e);
    base.addNav([
        { label: 'Trigger error', func: function () {
            assert(false, 'Artificial assertion error');
        }}
    ]);
    e.activate();
};
DebugControl.prototype.title = 'Debug settings';
