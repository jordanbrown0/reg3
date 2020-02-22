var debugControlSchema = [[
    { field: 'rpc', label: 'RPC', input: InputBool },
    { field: 'keyboard', label: 'Keyboard', input: InputBool },
    { field: 'dom', label: 'DOM', input: InputBool }
]];

function DebugControl()
{
    var o = this;
    DElement.call(o, 'div');
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
    e.activate();
};
DebugControl.prototype.title = 'Debug settings';
