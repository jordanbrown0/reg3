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
        item = base.processNav(item);
        if (!item) {
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
