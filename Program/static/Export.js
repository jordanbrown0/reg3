function Export()
{
    var o = this;
    Export.sup.constructor.call(o, 'div');
}
extend(DElement, Export);

Export.prototype.activate = function () {
    var o = this;

    db.reg.listTables(function (tables) {
        o.bools = new InputSelectMulti({options: Object.keys(tables)});
        o.appendChild(o.bools);

        base.addNav([
            { label: 'Cancel', key: 'Escape', func: function () { home(); } },
            { label: '&All', func: function () {
                db.reg.exportResync();
            } },
            { label: '&Selected', func: function () {
                o.exportSelected();
            } }
        ]);
    });
};

Export.prototype.exportSelected = function () {
    var o = this;

    var selected = o.bools.get();
    db.reg.exportResync(selected);
};

Export.prototype.title = 'Export...';