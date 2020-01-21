function ReportsNewByDate()
{
	var o = this;
    DElement.call(o, 'div', {className: 'ReportsNewByDate'});
}
extend(DElement, ReportsNewByDate);

ReportsNewByDate.prototype.activate = function () {
	var o = this;
	
	table.members.reduce(
		{ expr: 
			{ addto: [ {left: [ {f: 'entered'}, 10 ]}, 1 ]}
		},
		gotTotals);

	function gotTotals(totals) {
		o.totals = totals;
		var tbody = new DElement('tbody');
		var t = new DElement('table',
			new DElement('thead',
				tr(th('New memberships by date', { colSpan: 2 }))
			),
			tbody
		);

		var grand = 0;
		Object.keys(o.totals).sort().forEach(function (d) {
			tbody.appendChild(tr(
				td(o.totals[d]),
				td(d || 'Preregistered')
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

ReportsNewByDate.prototype.title = 'Reports';
