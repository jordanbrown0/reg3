function Admin()
{
	var o = this;
    DElement.call(o, 'div');
	o.menu = new Menu({ items: [
		{ title: 'Administration menu' },
		{ key: 'c', label: '(C)lasses', func: function () {
			base.switchTo(new ClassManager());
		}},
		{ key: 'g', label: '(G)lobal configuration', func: function () {
			base.switchTo(new GlobalEdit());
		}},
		{ key: 'p', label: '(P)rinter management', func: function () {
			base.switchTo(new PrinterManager());
		}},
		{ key: 's', label: '(S)tation configuration', func: function () {
			base.switchTo(new StationEdit());
		}},
		{ key: 'q', label: '(Q) station manager', func: function () {
			base.switchTo(new StationManager());
		}},
		{           label: 'Categories', func: function () {
			base.switchTo(new CategoriesManager());
		}},
		{ key: 'v', label: '(V) server manager', func: function () {
			base.switchTo(new ServerManager());
		}},
		{ key: 't', label: '(T)est printer', func: label_test },
		{ key: 'i', label: '(I)mport', func: function () {
			base.switchTo(new Import());
		}},
		{ key: 'e', label: '(E)xport', func: function () {
			base.switchTo(new Export());
		}},
		{           label: 'Selected import/export', func: function () {
			base.switchTo(new SelectedImportExport());
		}}
	]});
	o.appendChild(o.menu);
}
extend(DElement, Admin);

Admin.prototype.activate = function () {
	var o = this;
	o.menu.activate();
	base.addNav([
		{ key: 'Escape', msg: 'Cancel', func: function () { home(); } }
	]);
};
