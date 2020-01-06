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
				ret.grand = ret.warm + ret.noShow;
				log('results', ret);
				base.addNav([
					{ key: 'P', msg: 'Print', func: function () { o.print(); } }
				]);
				var editor = new Editor(ret, {
					readonly: true,
					schema: ReportsSummary.schema,
					cancel: home,
					cancelButton: null,
					done: home,
					doneButton: 'Done'
				});
				o.appendChild(editor);
				editor.activate();
			}
		);
	});
};

ReportsSummary.prototype.print = function () {
	getReportPrinterInfo(gotInfo, function () {});
	function gotInfo(ret) {
		log('printer', ret.printer);
		log('caps', ret.caps);
		rpc.label_print(ret.printer, [
			{ x: ret.caps.horzres/2, y: ret.caps.vertres/2, font: ret.cfg.font, size:ret.caps.dpix/2, text: 'Hello world' }
		], function () {alert('printed');});

	}
};

ReportsSummary.schema = [
	[
		{ title: 'Membership Statistics' },
		{ field: 'warm', label: 'Warm bodies', input: InputInt },
		{ field: 'noShow', label: 'No show', input: InputInt },
		{ field: 'prereg', label: 'Preregistered', input: InputInt },
		{ field: 'atTheDoor', label: 'At the door', input: InputInt },
		{ field: 'grand', label: 'Grand total', input: InputInt },
		{ field: 'void', label: 'Void', input: InputInt }
	]
];
