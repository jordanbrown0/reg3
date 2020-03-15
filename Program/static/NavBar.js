function NavBar()
{
    var o = this;
    NavBar.sup.constructor.call(o, 'table', {className: 'NavBar'});
    o.content = o.appendChild(tr()).appendChild(td());
}
extend(DElement, NavBar);

NavBar.prototype.set = function (a) {
    var o = this;
    o.content.removeChildren();
    o.add(a);
};

NavBar.prototype.add = function (a) {
    var o = this;
    a.forEach(function (e) {
        if (e.perms && !cfg.permissions.includes(e.perms)) {
            return;
        }
        if (e.msg) {
            var msg = e.msg;
            if (e.key) {
                msg += ' ('+e.key+')';
            }
            o.content.appendChild(new Button(msg, {
                onclick: function () {
                    if (isRPCActive()) {
                        log('button ignored because RPC active');
                    } else {
                        e.func();
                    }
                }
            }));
        }
    });
};
