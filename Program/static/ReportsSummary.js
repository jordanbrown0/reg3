function ReportsSummary()
{
	var o = this;
    DElement.call(o, 'div');
}
extend(DElement, ReportsSummary);

ReportsSummary.prototype.activate = function () {
	var o = this;
	
	getAllConfig(function (cfg) {
		var atdExpr;
		if (cfg.startDate) {
			atdExpr = { and: [
				{ f: 'entered' },
				{ ge: [
					{ f: 'entered' },
					cfg.startDate
				]}
			]};
		} else {
			atdExpr = { f: 'entered' };
		}
		table.members.reduce(
			{ expr: 
				{ if: [
					{ eq: [ { f: 'class' }, cfg.voidClass ] },
					{ addto: [ 'void', 1 ]},
					[
						{ if: [
							{ f: 'pickedup' },
							{ addto: [ 'warm', 1 ]},
							{ addto: [ 'noShow', 1 ]}
						]},
						{ if: [
							atdExpr,
							{ addto: [ 'atTheDoor', 1 ]},
							{ addto: [ 'prereg', 1 ]}
						]}
					]
				]}
			},
			function (ret) {
				ret.grand = (ret.warm||0) + (ret.noShow||0);
				base.addNav([
					{ key: 'L', msg: 'Label', func: function () { o.label(); } },
					{ key: 'Enter', msg: 'Done', func: home },
					{ key: 'Escape', func: home }
				]);
				o.appendChild(
					new DElement('table',
						new DElement('thead',
							new DElement('th',
								'Membership Statistics',
								{ colSpan: 2 }
							)
						)
					)
				).appendChild(
					tr(td('Warm Bodies'), td(ret.warm||0)),
					tr(td('No show'), td(ret.noShow||0)),
					tr(td('Preregistered'), td(ret.prereg||0)),
					tr(td('At the door'), td(ret.atTheDoor||0)),
					tr(td('Grand total'), td(ret.grand)),
					tr(td('Void'), td(ret.void||0))
				);
			}
		);
	});
	
	function v(val) {
		return (val || 0);
	}
};

ReportsSummary.prototype.label = function () {
	getReportPrinterInfo(gotInfo, function () {});
	function gotInfo(ret) {
		log('printer', ret.printer);
		log('caps', ret.caps);
		rpc.label_print(ret.printer, [
			{ x: ret.caps.horzres/2, y: ret.caps.vertres/2, font: ret.cfg.font, size:ret.caps.dpix/2, text: 'Hello world' }
		], function () {alert('printed');});

	}
};
