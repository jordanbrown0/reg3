function Button(contents, params)
{
    Button.sup.constructor.call(this, 'button', contents);
    this.n.onclick = function () { runcallback(params.onclick) };
}
extend(DElement, Button);