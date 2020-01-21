function ReportsPickedUpByDate()
{
	var o = this;
    DElement.call(o, 'div', {className: 'ReportsPickedUpByDate'});
}
extend(DElement, ReportsPickedUpByDate);

ReportsPickedUpByDate.prototype.activate = function () {
	var o = this;
	
	table.members.reduce(
		{ expr: 
			{ addto: [ {left: [ {f: 'pickedup'}, 10 ]}, 1 ]}
		},
		gotTotals);

	function gotTotals(totals) {
		o.totals = totals;
		var tbody = new DElement('tbody');
		var t = new DElement('table',
			new DElement('thead',
				tr(th('Memberships picked up by date', { colSpan: 2 }))
			),
			tbody
		);

		var grand = 0;
		Object.keys(o.totals).sort().forEach(function (d) {
			tbody.appendChild(tr(
				td(o.totals[d]),
				td(d || 'Not picked up')
			));
			grand += o.totals[d];
		});

		tbody.appendChild(tr(td(grand), td('Grand total')));
		
		o.appendChild(t);
		
		base.addNav([
			{ key: 'P', msg: 'Print', func: function () {
				window.print();
			} },
			{ key: 'Enter', msg: 'Done', func: home },
			{ key: 'Escape', func: home }
		]);
	
	}
};

ReportsPickedUpByDate.prototype.title = 'Reports';
