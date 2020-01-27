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
    assertParams(params, 'from', 'pick');
    var myparams = Object.assign({
        table: table.upgrades,
        schema: upgradesSchema
    }, params);
    UpgradePicker.sup.constructor.call(o, myparams);
}
extend(DBManager, UpgradePicker);

UpgradePicker.prototype.activate = function () {
    var o = this;
    
    getAllConfig(function (conf) {
        o.conf = conf;
        UpgradePicker.sup.activate.call(o);
    });
};

UpgradePicker.prototype.title = 'Upgrade to...';

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
    return (new DElement('tr',
        new DElement('td', o.conf.currencyPrefix + r.amount + o.conf.currencySuffix, {id: 'amount'}),
        description
    ));
};

UpgradePicker.prototype.getFilter = function () {
    var o = this;
    
    var f = { and: [
        { eq: [ {f: 'from' }, o.params.from ] },
        Class.getFilter(o.conf)
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

var Upgrades = {};

Upgrades.list = function (cb) {
    table.upgrades.list({}, cb);
};

init.push(function upgradesInit() {
    table.upgrades = new DBTable(db.reg, 'upgrades',
        { defaults: Editor.defaults(upgradesSchema) }
    );
});
