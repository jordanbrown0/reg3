var globalSchema = [
    [
        { field: 'convention', label: 'Convention name', default: 'My Convention', required: true },
        { field: 'startDate', label: 'Convention start date',
            input: InputDate },
        { field: 'currencyPrefix', label: 'Currency prefix', default: '$' },
        { field: 'currencySuffix', label: 'Currency suffix', default: '' },
        { field: 'screenFontSize',
            label: 'Screen font size',
            input: InputInt,
            default: 14,
            suffix: 'pt' },
    ],
    [
        { title: 'Badges' },
        { field: 'font',
            label: 'Badge font',
            default: 'Times New Roman',
            required: true
        },
        { field: 'badgeCopies',
            label: 'Number of copies',
            input: InputInt,
            default: 1,
            required: true
        },
        { field: 'realNameLabel',
            label: 'Real name label too?',
            input: InputBool,
            default: false
        },
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
        { field: 'margins',
            label: 'Margins: Left, Right, Top, Bottom',
            input: InputObject,
            default: { left: 0, right: 0, top: 0, bottom: 0 },
            schema: [
                { field: 'left', input: InputInt, required: true },
                { field: 'right', input: InputInt, required: true },
                { field: 'top', input: InputInt, required: true },
                { field: 'bottom', input: InputInt, required: true }
            ]
        }
    ], [
        { title: 'Advanced' },
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
        schema: globalSchema,
        reconfig: true
    });
}
extend(DBEdit, GlobalEdit);

GlobalEdit.prototype.title = 'Global configuration';

GlobalEdit.prototype.get = function (cb) {
    Global.get(cb);
};

var Global = {};

Global.get = function (cb) {
    table.global.getOrAdd("", {}, null, cb);
};

init.push(function globalConfigInit() {
    table.global = new DBTable(db.reg, 'global',
        { schema: globalSchema }
    );
});
