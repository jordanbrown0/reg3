function ReportsByClass()
{
	var o = this;
    DElement.call(o, 'div', {className: 'ReportsByClass'});
}
extend(DElement, ReportsByClass);

ReportsByClass.prototype.activate = function () {
	var o = this;
	
	var page = [
		{ title: 'Memberships by class' }
	];
	
	var schema = [ page ];
		
	getAllConfig(gotConfig);
	
	function gotConfig(conf) {
		o.conf = conf;
	
		table.classes.list({ sort: [ 'order' ] }, gotClasses);
	}
	
	function gotClasses(classes) {
		forEachArrayObject(classes, function (k, c) {
			var entry = {
				field: c.code,
				label: c.description,
				input: InputInt
			};
			if (c.code == o.conf.voidClass) {
				voidEntry = entry;
			} else {
				page.push(entry);
			}
		});
		page.push({
			field: 'grand',
			label: 'Grand total',
			input: InputInt
		});
		page.push(voidEntry);
		
		table.members.reduce(
			{ expr: 
				{ addto: [ {f: 'class'}, 1 ]}
			},
			gotTotals);
	}
	
	function gotTotals(totals) {
		var grand = 0;
		for (var code in totals) {
			grand += totals[code];
		}
		totals.grand = grand;
		var editor = new Editor(totals, {
			readonly: true,
			schema: schema,
			cancel: home,
			cancelButton: null,
			done: home,
			doneButton: 'Done'
		});
		o.appendChild(editor);
		editor.activate();
	}
};
