function Button(contents, params)
{
    Button.sup.constructor.call(this, 'button', contents, {
        className: 'Button',
        tabIndex: -1,
        onclick: function () { runcallback(params.onclick); }
    });
}
extend(DElement, Button);