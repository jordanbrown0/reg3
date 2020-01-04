function SelectedImportExport()
{
	var o = this;
    SelectedImportExport.sup.constructor.call(o, 'div');
	
	o.appendChild(new DElement('div', 'Import', { className: 'Title' }));

	var fileInput = new DElement('input', {
		type: 'file',
		onchange: function () {
			log('fileInput change');
			log(fileInput.n.files);
			REST.upload('/REST/importDB/reg', fileInput.n.files.item(0),
				function (conflicts) {
					base.switchTo(new ConflictListResolver(conflicts));
				}
			);
		}
	});
	o.appendChild(fileInput);

	o.appendChild(new DElement('div', 'Export', { className: 'Title' }));
	
	rpc.DBlistTables('reg', function (tables) {
		var i;
		var checkboxes = {};
		var table = new DElement('table');
		for (i = 0; i < tables.length; i++) {
			var tName = tables[i];
			var bool = new InputBool({});
			table.appendChild(
				new DElement('tr',
					new DElement('td', bool),
					new DElement('td', tName)
				)
			);
			checkboxes[tName] = bool;
		}
		o.appendChild(table);
		o.appendChild(new Button('Export selected', { onclick: function () {
			var selected = [];
			for (i = 0; i < tables.length; i++) {
				var tName = tables[i];
				if (checkboxes[tName].get()) {
					selected.push(tName);
				}
			}
			REST.exportDB('reg', selected);
		}}));
	});
}
extend(DElement, SelectedImportExport);

SelectedImportExport.prototype.activate = function () {
	base.addNav([
		{ key: 'Escape', msg: 'Cancel', func: function () { home(); } }
	]);
};

