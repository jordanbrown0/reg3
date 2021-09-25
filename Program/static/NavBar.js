function NavBar()
{
    var o = this;
    NavBar.sup.constructor.call(o, 'table', {className: 'NavBar'});
    o.content = o.appendChild(tr()).appendChild(td());
    o.items = [];
}
extend(DElement, NavBar);

NavBar.prototype.clear = function () {
    var o = this;
    o.content.removeChildren();
    o.items = [];
};

NavBar.prototype.add = function (e) {
    var o = this;
    if (!e.label) {
        return;
    }

    if (e.order == undefined) {
        e.order = 50;
    }
    
    e.button = new Button(e.label, {
        onclick: function () {
            if (isRPCActive()) {
                log('button ignored because RPC active');
            } else {
                e.func();
            }
        }
    });
    
    // A new entry is inserted before the next entry with a larger order value.
    // (And thus items with the same order value are inserted in add order.)
    for (i = 0; i < o.items.length; i++) {
        if (o.items[i].order > e.order) {
            o.content.insertBefore(e.button, o.items[i].button);
            o.items.splice(i, 0, e);
            return;
        }
    }
    o.content.appendChild(e.button);
    o.items.push(e);
};
