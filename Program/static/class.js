var classSchema = [
    [
        { field: 'code', label: 'Code', required: true },
        { field: 'description', label: 'Description', required: true },
        { field: 'amount', label: 'Amount', input: InputCurrency,
            required: true },   // Float?  Does anybody need pennies?
        { field: 'badgeOK', label: 'OK for badging?', input: InputBool,
            default: true },
        { field: 'metaclass', label: 'Metaclass' },
        { field: 'onBadge', label: 'Print on badge' },
        { field: 'phoneLabel', label: 'Print phone number on second label',
            input: InputBool, default: false },
        { field: 'order', label: 'Order', input: InputInt, required: true },
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
    return (tr(
        td(r.order, { id: 'order' }),
        td(cfg.currencyPrefix + r.amount + cfg.currencySuffix, {id: 'amount'}),
        td(r.code, { id: 'code' }),
        td(r.description, { id: 'description' }),
        td(r.metaclass || '', { id: 'metaclass' }),
        td(LDate.fromJSON(r.start).toDisplayDate(), { id: 'start' }),
        td(LDate.fromJSON(r.end).toDisplayDate(), { id: 'end' })
    ));
};

ClassManager.prototype.title = 'Class administration';

ClassManager.prototype.header = function () {
    return (tr(
        th('Order'),
        th('Amount'),
        th('code'),
        th('Description'),
        th('MC'),
        th('Start'),
        th('End')
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
        canShowAll: cfg.permissions.includes('allDays')
    };
    Object.assign(myparams, params);
    ClassManager.sup.constructor.call(o, myparams);
}
extend(DBManager, ClassPicker);

ClassPicker.prototype.getFilter = function () {
    var o = this;

    return (Class.getFilter());
};

ClassPicker.prototype.summarize = function (k, r) {
    var o = this;
    return (new DElement('tr',
        new DElement('td', cfg.currencyPrefix + r.amount + cfg.currencySuffix, {id: 'amount'}),
        new DElement('td', r.description, { id: 'description' })
    ));
};

ClassPicker.prototype.pick = function (k, r) {
    var o = this;
    o.params.pick(k, r);
};

ClassPicker.prototype.sort = [ 'order' ];

var Class = {};

// Calls the callback with null if the class does not exist.
Class.get = function (id, cb) {
    table.classes.getOrNull(id, cb);
};

Class.getDescription = function (id, cb) {
    Class.get(id, function (c) {
        cb(c ? c.description : 'Bad class "' + id + '"');
    });
};

// Return a filter expression that checks for metaclass and start/end times.
// Applicable to both classes and upgrades.
Class.getFilter = function () {
    var f = { and: [] };
    if (cfg.metaclasses) {
        f.and.push(
            { includes: [ cfg.metaclasses, { f: 'metaclass' } ] }
        );
    }

    var nowExpr =  cfg.offlineRealTime
        ? { date: [] }
        : LDate.fromJSON(cfg.offlineAsOf).toJSONDate();
    f.and.push(
        { or: [
            { not: { f: 'start' } },
            { ge: [ nowExpr, { f: 'start' } ] }
        ] }
    );
    f.and.push(
        { or: [
            { not: { f: 'end' } },
            { le: [ nowExpr, { f: 'end' } ] }
        ] }
    );

    return (f);
};

init.push(function classInit() {
    table.classes = new DBTable(db.reg, 'classes',
        { schema: classSchema }
    );
});