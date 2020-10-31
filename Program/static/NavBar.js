function NavBar()
{
    var o = this;
    NavBar.sup.constructor.call(o, 'table', {className: 'NavBar'});
    o.content = o.appendChild(tr()).appendChild(td());
}
extend(DElement, NavBar);

NavBar.prototype.clear = function () {
    var o = this;
    o.content.removeChildren();
};

NavBar.prototype.add = function (e) {
    var o = this;
    if (e.label) {
        var label = e.label;
        o.content.appendChild(new Button(label, {
            onclick: function () {
                if (isRPCActive()) {
                    log('button ignored because RPC active');
                } else {
                    e.func();
                }
            }
        }));
    }
};
