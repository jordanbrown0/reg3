function Export()
{
	var o = this;
    DElement.call(o, 'div');
}
extend(DElement, Export);

Export.prototype.activate = function () {
	base.addNav([
		{ key: 'Escape', msg: 'Cancel', func: function () { home(); } }
	]);

	REST.exportDB('reg');
	home();
};
