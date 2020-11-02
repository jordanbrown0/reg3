function Admin()
{
    var o = this;
    Admin.sup.constructor.call(o, 'div');
    o.menu = new Menu({ items: [
        { label: '&Classes', func: function () {
            base.switchTo(new ClassManager());
        }},
        { label: '&Global configuration', func: function () {
            base.switchTo(new GlobalEdit());
        }},
        { label: '&Printer management', func: function () {
            base.switchTo(new PrinterManager());
        }},
        { label: '&Station configuration', func: function () {
            base.switchTo(new StationEdit());
        }},
        { label: '&Q station manager', func: function () {
            base.switchTo(new StationManager());
        }},
        { label: '&Upgrades', func: function () {
            base.switchTo(new UpgradesManager());
        }},
        { label: 'Categories', func: function () {
            base.switchTo(new CategoriesManager());
        }},
        { label: 'Corrections', func: function () {
            base.switchTo(new CorrectionsManager());
        }},
        { label: 'E&xternal import/export', func: function () {
            base.switchTo(new External());
        }},
        { label: 'ser&ver manager', func: function () {
            base.switchTo(new ServerManager());
        }},
        { label: '&Test printer', func: label_test },
        { label: '&Import', func: function () {
            base.switchTo(new Import());
        }},
        { label: '&Export', func: function () {
            base.switchTo(new Export());
        }},
        { label: 'Zap', func: function () {
            // Note:  Zap does not have a one-key shortcut, for safety.
            base.switchTo(new Zap());
        }}
    ]});
    o.appendChild(o.menu);
}
extend(DElement, Admin);

Admin.prototype.activate = function () {
    var o = this;
    o.menu.activate();
    base.addNav([
        { label: 'Cancel', key: 'Escape', func: function () { home(); } }
    ]);
};

Admin.prototype.title = 'Administration';
