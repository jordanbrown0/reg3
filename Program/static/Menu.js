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
        var tr = new DElement('tr');
        o.appendChild(tr);
        if (item.title) {
            var title = new DElement('td', item.title, {
                id: item.id,
                className: 'Title'
            });
            tr.appendChild(title);
        } else if (item.spacer) {
            // Maybe we don't need anything here
            // Maybe need an ID for CSS to control height
        } else {
            var ent = new DElement('td', item.label, {
                id: item.id,
                onclick: item.func,
                className: 'Item'
            });
            tr.appendChild(ent);
            if (item.key) {
                keys.push({key: item.key, func: item.func});
            }
        }
    });
    base.addNav(keys);
};
