// Is this a base.switchTo() object?
function Menu(params)
{
    var o = this;
    DElement.call(o, 'table', {className: 'Menu'});
    o.params = params;
}
extend(DElement, Menu);

Menu.prototype.activate = function () {
    var o = this;
    var keys = [];

    o.params.items.forEach(function (item) {
        if (!base.processNav(item)) {
            return;
        }
        var ent;
        if (item.title) {
            ent = td(item.title, { className: 'Title' });
        } else {
            ent = td(item.label, { className: 'Item' });
        }
        if (item.id) {
            ent.setProperties({id: item.id});
        }
        if (item.func) {
            ent.setProperties({onclick: item.func});
        }
        o.appendChild(tr(ent));
        if (item.key) {
            keys.push({key: item.key, func: item.func});
        }
    });
    base.addNav(keys);
};

function MenuPage(params)
{
    var o = this;
    MenuPage.sup.constructor.call(o, 'div');
    o.menu = new Menu(params);
    o.appendChild(o.menu);
}
extend(DElement, MenuPage);

MenuPage.prototype.activate = function () {
    var o = this;
    o.menu.activate();
    base.addNav([
        { label: 'Cancel', key: 'Escape', func: function () { home(); } }
    ]);
};
