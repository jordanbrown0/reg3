var upgradesSchema = [
    [
        { field: 'from', label: 'From class', required: true,
            input: InputClass },
        { field: 'to', label: 'To class', required: true, input: InputClass },
        { field: 'amount', label: 'Amount', required: true,
            input: InputCurrency },
        { field: 'metaclass', label: 'Metaclass' },
        { field: 'description', label: 'Description' },
        { field: 'start', label: 'Start date', input: InputDate },
        { field: 'end', label: 'End date', input: InputDate },
    ],
];

function UpgradesManager() {
    var o = this;
    params = {
        titleManager: 'Upgrade administration',
        titleEdit: 'Edit upgrade',
        titleAdd: 'New upgrade',
        table: table.upgrades,
        schema: upgradesSchema,
        canAdd: true,
        canDelete: true
    };

    UpgradesManager.sup.constructor.call(o, params);
}
extend(DBManager, UpgradesManager);

UpgradesManager.title = 'Upgrade administration...';

UpgradesManager.prototype.summarize = function (k, r) {
    var tdFrom = td({ id: 'from' });
    var tdTo = td({ id: 'to' });
    Class.getDescription(r.from, function (d) {
        tdFrom.appendChild(d);
    });
    Class.getDescription(r.to, function (d) {
        tdTo.appendChild(d);
    });
    return (tr(
        tdFrom,
        tdTo,
        td(r.amount, { id: 'amount' }),
        td(r.description, { id: 'description' })
    ));
};

function UpgradePicker(params)
{
    var o = this;
    assertParams(params, 'member', 'pick');
    var myparams = Object.assign({
        table: table.upgrades,
        schema: upgradesSchema
    }, params);
    UpgradePicker.sup.constructor.call(o, myparams);
}
extend(DBManager, UpgradePicker);

UpgradePicker.prototype.title = 'Upgrade to...';

UpgradePicker.prototype.activate = function () {
    var o = this;
    UpgradePicker.sup.activate.call(o);
    base.addNav([
        { label: 'Other', perms: 'adHocUpgrades', func: function () {
            base.switchTo(new UpgradeAdHocPicker({
                member: o.params.member,
                pick: function (k, r) { o.pick(k, r); }
            }));
        } }
    ]);
};

UpgradePicker.prototype.summarize = function (k, r) {
    var o = this;
    var description = td({id: 'description'});
    if (r.description) {
        description.appendChild(r.description);
    } else {
        Class.getDescription(r.to, function (d) {
            description.appendChild(d);
        });
    }
    return (tr(
        td(cfg.currencyPrefix + r.amount + cfg.currencySuffix, {id: 'amount'}),
        description
    ));
};

UpgradePicker.prototype.getFilter = function () {
    var o = this;

    var f = { and: [
        { eq: [ {f: 'from' }, o.params.member.class ] },
        Class.getFilter(cfg)
    ] };
    return (f);
};

UpgradePicker.prototype.pick = function (k, r) {
    var o = this;
    o.params.pick(k, r);
};

UpgradePicker.prototype.cancel = function () {
    var o = this;
    if (o.params.cancel) {
        o.params.cancel();
    } else {
        UpgradePicker.sup.cancel();
    }
};

UpgradePicker.prototype.sort = [ 'order' ];


// NEEDSWORK this seems to mostly work, but seems overly complex
// and the page titles are undefined.
function UpgradeAdHocPicker(params) {
    var o = this;
    o.params = params;
    UpgradeAdHocPicker.sup.constructor.call(o, 'span');
}

extend(DElement, UpgradeAdHocPicker);

UpgradeAdHocPicker.prototype.activate = function () {
    var o = this;

    base.switchTo(new ClassPicker({
        titleManager: 'Upgrade to...',
        pick: function (k, r) {
            base.switchTo(new UpgradeAdHocPicker2({
                member: o.params.member,
                class: r,
                pick: function (r) { o.params.pick(null, r); }
            }));
        }
    }));
};



function UpgradeAdHocPicker2(params) {
    var o = this;
    o.params = params;
    UpgradeAdHocPicker2.sup.constructor.call(o, 'span');
};

extend(DElement, UpgradeAdHocPicker2);

UpgradeAdHocPicker2.prototype.activate = function () {
    var o = this;
    var schema = [[
        { field: 'from', label: 'From class', input: InputClassLookup,
            readOnly: true },
        { field: 'to', label: 'To class', input: InputClassLookup,
            readOnly: true },
        { field: 'currentAmount', label: 'Paid so far', input: InputCurrency,
            readOnly: true },
        { field: 'classAmount', label: 'Class cost', input: InputCurrency,
            readOnly: true },
        { field: 'upgradeAmount', label: 'Upgrade cost', input: InputCurrency }
    ]];
    var currentAmount = o.params.member.amount || 0;
    var classAmount = o.params.class.amount || 0;
    var r = {
        from: o.params.member.class,
        to: o.params.class.code,
        currentAmount: currentAmount,
        classAmount: classAmount,
        upgradeAmount: classAmount - currentAmount
    };
    var editor = new Editor(r, {
        schema: schema,
        cancel: home,
        done: function () {
            o.params.pick({
                from: r.from,
                to: r.to,
                amount: r.upgradeAmount
            });
        }
    });
    o.appendChild(editor);
    editor.activate();
};

UpgradeAdHocPicker2.prototype.title = 'Confirm upgrade...';

var Upgrades = {};

Upgrades.list = function (cb) {
    table.upgrades.list({}, cb);
};

init.push(function upgradesInit() {
    table.upgrades = new DBTable(db.reg, 'upgrades',
        { defaults: Editor.defaults(upgradesSchema) }
    );
});
