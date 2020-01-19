var classSchema = [
	[
		{ field: 'code', label: 'Code', required: true },
		{ field: 'description', label: 'Description', required: true },
		{ field: 'amount', label: 'Amount', input: InputInt, required: true },	// Float?  Does anybody need pennies?
		{ field: 'badgeOK', label: 'OK for badging?', input: InputBool },
		{ field: 'metaclass', label: 'Metaclass' },
		{ field: 'onBadge', label: 'Print on badge' },
		{ field: 'phoneLabel', label: 'Print phone number on second label', input: InputBool },
		{ field: 'order', label: 'Order', required: true },
		{ field: 'start', label: 'Start date', input: InputDate },
		{ field: 'end', label: 'End date', input: InputDate },
	],
];

function ClassManager()
{
	var o = this;
    ClassManager.sup.constructor.call(o, {
		table: table.classes,
		schema: classSchema,
		canAdd: true,
		canDelete: true,
		keyField: 'code'
	});
	ClassManager.prototype.Edit = ClassEdit;
	ClassManager.prototype.Add = ClassAdd;

}
extend(DBManager, ClassManager);

ClassManager.prototype.sort = [ 'order' ];

ClassManager.prototype.summarize = function (k, r) {
	var o = this;
	return (new DElement('tr',
		new DElement('td', r.order, { id: 'order' }),
		new DElement('td', o.conf.currency_prefix + r.amount + o.conf.currency_suffix, {id: 'amount'}),
		new DElement('td', r.code, { id: 'code' }),
		new DElement('td', r.description, { id: 'description' }),
		new DElement('td', r.metaclass || '', { id: 'metaclass' }),
		new DElement('td', r.start || '', { id: 'start' }),
		new DElement('td', r.end || '', { id: 'end' })
	));
};

ClassManager.prototype.activate = function () {
	var o = this;
	getAllConfig(function (conf) {
		o.conf = conf;
		ClassManager.sup.activate.call(o);
	});
};

ClassManager.prototype.title = 'Class administration';

ClassManager.prototype.header = function () {
	return (new DElement('tr',
		new DElement('th', 'Order'),
		new DElement('th', 'Amount'),
		new DElement('th', 'code'),
		new DElement('th', 'Description'),
		new DElement('th', 'MC'),
		new DElement('th', 'Start'),
		new DElement('th', 'End')
	));
};

function ClassEdit(/*args*/)
{
	ClassEdit.sup.constructor.apply(this, arguments);
}

extend(DBEdit, ClassEdit);

ClassEdit.prototype.title = function () {
	// NEEDSWORK this should probably include the class code and description.
	return ('Edit class...');
};

function ClassAdd(/*args*/)
{
	ClassAdd.sup.constructor.apply(this, arguments);
}

extend(DBAdd, ClassAdd);

ClassAdd.prototype.title = function () {
	return ('New class...');
};

// NEEDSWORK ClassManager and ClassPicker should perhaps be the same,
// just with different pick methods.  (But also:  picker is filtered and so needs
// show-all, manager needs add.)
function ClassPicker(params)
{
	var o = this;
	var myparams = {
		table: table.classes,
		schema: classSchema,
		canShowAll: true
	};
	Object.assign(myparams, params);
    ClassManager.sup.constructor.call(o, myparams);
}
extend(DBManager, ClassPicker);

ClassPicker.prototype.activate = function () {
	var o = this;

	getAllConfig(function (conf) {
		o.conf = conf;
		o.filter = { and: [] };
		var mcf;
		if (conf.metaclasses) {
			o.filter.and.push(
				{ includes: [ conf.metaclasses, { f: 'metaclass' } ] }
			);
		}
		o.filter.and.push(
			{ or: [
				{ not: { f: 'start' } },
				{ ge: [ { dateOnly: [] }, { f: 'start' } ] }
			] }
		);
		o.filter.and.push(
			{ or: [
				{ not: { f: 'end' } },
				{ le: [ { dateOnly: [] }, { f: 'end' } ] }
			] }
		);
		ClassPicker.sup.activate.call(o);
	});
};

ClassPicker.prototype.summarize = function (k, r) {
	var o = this;
	return (new DElement('tr',
		new DElement('td', o.conf.currency_prefix + r.amount + o.conf.currency_suffix, {id: 'amount'}),
		new DElement('td', r.description, { id: 'description' })
	));
};

ClassPicker.prototype.pick = function (k, r) {
	var o = this;
	o.params.pick(k, r);
};

ClassPicker.prototype.sort = [ 'order' ];

var Class = {};

// NEEDSWORK:  Something bad will happen if the get fails.
Class.get = function (id, cb) {
	table.classes.getOrNull(id, cb);
};

Class.getDescription = function (id, cb) {
	Class.get(id, function (c) {
		cb(c ? c.description : 'Bad class "' + id + '"');
	});
};

init.push(function classInit() {
	table.classes = new DBTable(db.reg, 'classes',
		{ defaults: Editor.defaults(classSchema) }
	);
});