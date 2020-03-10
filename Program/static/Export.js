function Export()
{
    var o = this;
    Export.sup.constructor.call(o, 'div');
}
extend(DElement, Export);

Export.prototype.activate = function () {
    var o = this;
    
    base.addNav([
        { key: 'Escape', msg: 'Cancel', func: function () { home(); } },
        { key: 'a', msg: 'Export All', func: function () {
            db.reg.export();
        } }
    ]);
    db.reg.listTables(function (tables) {
        o.bools = new InputSelectMulti({options: tables});
        o.appendChild(o.bools);

        base.addNav([
            { key: 's', msg: 'Export Selected', func: function () {
                o.exportSelected();
            } }
        ]);
    });
};

Export.prototype.exportSelected = function () {
    var o = this;
    
    var selected = o.bools.get();
    db.reg.export(selected);
};

Export.prototype.title = 'Export...';