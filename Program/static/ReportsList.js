function ReportsList()
{
	var o = this;
    DElement.call(o, 'div');
}
extend(DElement, ReportsList);

ReportsList.prototype.activate = function () {
	var o = this;

	base.addNav([
		{ key: 'P', msg: 'Print', func: function () { window.print(); } },
		{ key: 'Enter', msg: 'Done', func: home },
		{ key: 'Escape', func: home }
	]);

	var body = new DElement('tbody');

	var t = o.appendChild(
		new DElement('table',
			new DElement('thead',
				tr(
					new DElement('th', 'Last'),
					new DElement('th', 'First')
				)
			),
			body,
			new DElement('tfoot',
				tr(
					new DElement('th', 'Last'),
					new DElement('th', 'First')
				)
			)
		)
	);

	table.members.list({}, function (recs) {
		forEachArrayObject(recs, function (k, r) {
			body.appendChild(tr(
				td(r.last || ''),
				td(r.first || ''),
				td(joinTruthy(
					[ r.addr1, r.addr2, r.city, r.state, r.postcode, r.country ],
					' / '
				))
			));
		});
	});
};

ReportsList.prototype.title = 'Reports';
