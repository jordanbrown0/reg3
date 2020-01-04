var globalSchema = [
	[
		{ title: 'Global Configuration' },
		{ field: 'convention', label: 'Convention name', default: 'My Convention', required: true },
		{ field: 'startDate', label: 'Convention start date',
			input: InputDate },
		{ field: 'currency_prefix', label: 'Currency prefix', default: '$' },
		{ field: 'currency_suffix', label: 'Currency suffix', default: '' },
		{ field: 'voidClass', label: 'Class code for void memberships',
			default: 'Void' },
		{ title: 'Badges' },
		{ field: 'font', label: 'Badge font', default: 'Times New Roman', required: true },
		{ field: 'badgeCopies', label: 'Number of copies', input: InputInt, default: 1, required: true },
		{ field: 'badgeCity', label: 'Print city on badges?', input: InputBool, default: true },
		{ field: 'badgeNumber', label: 'Print badge number on badges?', input: InputBool, default: true },
		{ field: 'numberSize', label: 'Size of badge number', input: InputInt, default: 45, required: true },
		{ field: 'citySize', label: 'Size of city', input: InputInt, default: 45, required: true },
		{ field: 'nameSizes', label: 'Sizes to try for names', input: InputIntList, default: [160,140,120,100], required: true }
	],
];
var globalDefault;

function GlobalEdit()
{
	var o = this;
	GlobalEdit.sup.constructor.call(o, "", {
		table: table.global,
		schema: globalSchema
	});
}
extend(DBEdit, GlobalEdit);

GlobalEdit.prototype.get = function (cb) {
	Global.get(cb);
};

var Global = {};

Global.get = function (cb) {
	table.global.getOrAdd("", cb);
};

init.push(function () {
	table.global = new DBTable(db.reg, 'global',
		{ defaults: Editor.defaults(globalSchema) }
	);
});
