function Button(contents, params)
{
    Button.sup.constructor.call(this, 'button', contents, {
        className: 'Button',
        onclick: function () { runcallback(params.onclick); }
    });
}
extend(DElement, Button);