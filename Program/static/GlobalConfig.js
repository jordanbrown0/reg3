var globalSchema = [
    [
        { field: 'convention', label: 'Convention name', default: 'My Convention', required: true },
        { field: 'startDate', label: 'Convention start date',
            input: InputDate },
        { field: 'currencyPrefix', label: 'Currency prefix', default: '$' },
        { field: 'currencySuffix', label: 'Currency suffix', default: '' }
    ],
    [
        { title: 'Badges' },
        { field: 'font', label: 'Badge font', default: 'Times New Roman', required: true },
        { field: 'badgeCopies', label: 'Number of copies', input: InputInt, default: 1, required: true },
        { field: 'badgeCity',
            label: 'City?  Size?',
            input: InputObject,
            default: { print: true, size: 45 },
            schema: [
                { field: 'print', input: InputBool },
                { field: 'size', input: InputInt, required: true }
            ]
        },
        { field: 'badgeNumber',
            label: 'Number?  Size?',
            input: InputObject,
            default: { print: true, size: 45 },
            schema: [
                { field: 'print', input: InputBool },
                { field: 'size', input: InputInt, required: true }
            ]
        },
        { field: 'nameSizes',
            label: 'Sizes to try for names',
            input: InputIntList,
            default: [160,140,120,100],
            required: true,
            params: { required: true }
        },
        { field: 'ttl',
            label: 'How often to check configuration',
            input: InputInt,
            default: 60,
            required: true,
        }
    ],
];

function GlobalEdit()
{
    var o = this;
    GlobalEdit.sup.constructor.call(o, "", {
        table: table.global,
        schema: globalSchema
    });
}
extend(DBEdit, GlobalEdit);

GlobalEdit.prototype.title = 'Global configuration';

GlobalEdit.prototype.get = function (cb) {
    Global.get(cb);
};

GlobalEdit.prototype.done = function () {
    var o = this;
    Config.get(function () {
        GlobalEdit.sup.done.call(o);
    });
};

var Global = {};

Global.get = function (cb) {
    table.global.getOrAdd("", {}, null, cb);
};

init.push(function globalConfigInit() {
    table.global = new DBTable(db.reg, 'global',
        { defaults: Editor.defaults(globalSchema) }
    );
});
