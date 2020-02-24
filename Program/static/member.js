var lastKey = undefined;
var lastRec = undefined;

var Member = {};

// Shared between MemberEdit and MemberDisplay
// Maybe should be part of a superclass.
Member.setTitle = function () {
    var o = this;
    Class.getDescription(o.r.class, gotDesc);
    
    function gotDesc(d) {
        if (o.r.amount != undefined) {
            d += ' - ' + cfg.currencyPrefix + o.r.amount + cfg.currencySuffix;
        }
        var s = joinTruthy([o.r.first, o.r.last], ' ') + ' - ';
        if (o.r.void) {
            s += 'Void, was ';
        }
        s += d;
        o.titleSpan.replaceChildren(s);
    }
};

function MemberManager() {
    var o = this;
    MemberManager.sup.constructor.call(o, 'div', {className: 'MemberManager' });

    o.list = new List({
        table: table.members,
        summarize: function (k, r) {
            var status;
            if (r.void) {
                status = 'X';
            } else if (r.pickedup) {
                status = '*';
            } else {
                status = '';
            }

            var name = joinTruthy([ r.last, r.first ], ', ');
            var badge = joinTruthy([ r.badge1, r.badge2 ], ' ');
            if (badge) {
                name = joinTruthy([name, '(' + badge + ')'], ' ');
            }
            var s = joinTruthy([ name, r.addr1, r.city ], ' / ');

            return (tr({className: r.void ? 'Void' : 'Active'},
                td(status, { id: 'status' }),
                td(s, { id: 'summary' })
            ));
        },
        footer: tr({ id: 'footer' },
            td({colSpan: 2}, '* membership has been picked up')
        ),
        pick: function (k) {
            base.switchTo(new MemberDisplay(k));
        },
        cancel: home
    });
    o.appendChild(o.list);
}
extend(DElement, MemberManager);

MemberManager.prototype.activate = function () {
    var o = this;
    o.list.activate();
};

MemberManager.prototype.title = 'Look up previously registered member...';

var memberSchema = [
    [
        { title: 'General' },
        { field: 'first', label: 'First name' },
        { field: 'last', label: 'Last name' },
        { field: 'badge1', label: 'Badge name' },
        { field: 'badge2', label: '' },
        { field: 'addr1', label: 'Address' },
        { field: 'addr2', label: '' },
        { field: 'city', label: 'City' },
        { field: 'state', label: 'State' },
        { field: 'postcode', label: 'Postcode' },
        { field: 'country', label: 'Country' },
        { field: 'phone', label: 'Phone' },
        { field: 'position', label: 'Position' },
        { field: 'notes', label: 'Notes' }
    ],
    [
        { title: 'Membership' },
        { field: 'entered', label: 'Entered', readOnly: true,
            input: InputDateTime },
        { field: 'pickedup', label: 'Picked up', readOnly: true,
            input: InputDateTime },
        { field: 'class', label: 'Class', readOnly: true, input: InputClass },
        { field: 'amount', label: 'Amount paid', readOnly: true,
            input: InputCurrency },
        { field: 'number', label: 'Number', readOnly: true, input: InputInt }
    ],
    [
        { title: 'Categories' },
        { field: 'categories', label: 'Categories', input: InputSelectMultiDB,
            table: 'categories', keyField: 'name', textField: 'description'}
    ]
];

function MemberDisplay(k)
{
    var o = this;
    MemberDisplay.sup.constructor.call(o,'div');
    o.k = k;
    o.titleSpan = new DElement('span');
}
extend(DElement, MemberDisplay);

MemberDisplay.prototype.activate = function () {
    var o = this;

    table.members.get(o.k, gotRec);
    
    function gotRec(r) {
        o.r = r;
        
        lastKey = o.k;
        lastRec = r;

        o.setTitle();

        if (cfg.offlinePrint) {
            base.addNav([
                { key: 'P', msg: 'Print', func: function () {
                    if (working(true)) {
                        return;
                    }
                    o.print(home);
                } }
            ]);
        } else if (!r.pickedup && cfg.offlineMarkPickedUp) {
            base.addNav([
                { key: 'P', msg: 'Picked Up', func: function () {
                    if (working(true)) {
                        return;
                    }
                    o.markPickedUp(function () {
                        base.switchTo(new MemberDisplay(o.k));
                    });
                } }
            ]);
        }
        
        if (r.pickedup) {
            base.addNav([
                { msg: 'Un-pick-up', perms: 'unmark',
                    func: function () {
                        if (working(true)) {
                            return;
                        }
                        o.unmark(function () {
                            base.switchTo(new MemberDisplay(o.k));
                        });
                    }
                }
            ]);
        }

        base.addNav([
            { key: 'C', msg: 'Change', func: function () {
                base.switchTo(new MemberEdit(o.k));
            } },
            { key: 'U', msg: 'Upgrade', perms: 'upgrade', func: function () {
                base.switchTo(new MemberUpgrade(o.k));
            } }
        ]);

        if (r.void) {
            base.addNav([
                { msg: 'Unvoid', perms: 'void', func: function () {
                    if (working(true)) {
                        return;
                    }
                    o.setVoid(false, function () {
                        base.switchTo(new MemberDisplay(o.k));
                    });
                } }
            ]);
        } else {
            base.addNav([
                { msg: 'Void', perms: 'void', func: function () {
                    if (working(true)) {
                        return;
                    }
                    o.setVoid(true, function () {
                        base.switchTo(new MemberDisplay(o.k));
                    });
                } }
            ]);
        }

        var editor = new Editor(r, {
            schema: memberSchema,
            readOnly: true,
            cancel: home,
            done: function () {
                base.switchTo(new MemberEdit(o.k));
            }
        });
        o.appendChild(editor);
        editor.activate();
    }
};

MemberDisplay.prototype.setTitle = Member.setTitle;

MemberDisplay.prototype.title = function () {
    var o = this;
    return (o.titleSpan);
};

MemberDisplay.prototype.print = function (cb) {
    var o = this;
    label_badge(o.r,
        function () { o.markPickedUp(cb); },
        function () { working(false); }
    );
};

MemberDisplay.prototype.markPickedUp = function (cb) {
    var o = this;
    if (cfg.offlineMarkPickedUp && !o.r.pickedup) {
        var timestampExpr = cfg.offlineRealTime
            ? { dateTime: [] }
            : cfg.offlineAsOf;
        var serverDate = { setf: [ 'pickedup', timestampExpr ] };
        table.members.put(o.k, o.r, serverDate, function (rNew) { cb(); });
        return;
    }
    cb();
}

MemberDisplay.prototype.unmark = function (cb) {
    var o = this;
    
    if (o.r.pickedup) {
        o.r.pickedup = '';
        table.members.put(o.k, o.r, null, function (rNew) { cb(); });
        return;
    }
    cb();
};

MemberDisplay.prototype.setVoid = function (v, cb) {
    var o = this;
    
    o.r.void = v;
    table.members.put(o.k, o.r, null, function (rNew) { cb(); });
};

function MemberEdit(k)
{
    var o = this;
    MemberEdit.sup.constructor.call(o,'div');
    o.k = k;
    o.titleSpan = new DElement('span');
}
extend(DElement, MemberEdit);

MemberEdit.prototype.activate = function () {
    var o = this;

    var corrections = {};
    table.corrections.list({filter: {eq: [{f: 'table'}, 'members']}},
        gotCorrections);
        
    function gotCorrections(corRecs) {
        forEachArrayObject(corRecs, function (k, cr) {
            var field = cr.field;
            corrections[field] = {};
            cr.corrections.forEach(function (c) {
                corrections[field][c.from.toLowerCase()] = c.to;
            });
        });
        table.members.get(o.k, gotRec);
    }
    
    function gotRec(r) {
        o.r = r;
        o.setTitle();
        o.editor = new Editor(r, {
            schema: memberSchema,
            doneButton: 'Save',
            done: done,
            cancel: home
        });
        o.appendChild(o.editor);
        o.editor.activate();
    }
    
    function done() {
        if (working(true)) {
            return;
        }
        for (var f in corrections) {
            var cf = corrections[f];
            if (cf) {
                var to = cf[o.r[f].toLowerCase()];
                if (to) {
                    o.r[f] = to;
                }
            }
        }
        table.members.put(o.k, o.r, null,
            function (rNew) { base.switchTo(new MemberDisplay(o.k)); }
        );
    }
};

MemberEdit.prototype.setTitle = Member.setTitle;

MemberEdit.prototype.title = function () {
    var o = this;
    return (o.titleSpan);
};

function NewMember()
{
    var o = this;
    NewMember.sup.constructor.call(o,'div');
}
extend(DElement, NewMember);

NewMember.prototype.activate = function () {
    var o = this;
    var r = {};

    base.switchTo(new ClassPicker({
        titleManager: 'Class for new member...',
        pick: function (k, rClass) {
            r.class = rClass.code;
            r.amount = rClass.amount;
            base.switchTo(new NewMemberEditor(r));
        }
    }))
    ;
};

function NewMemberEditor(r) {
    var o = this;
    o.titlespan = new DElement('span');
    o.r = r;
    NewMemberEditor.sup.constructor.call(o,'div');
}
extend(DElement, NewMemberEditor);

NewMemberEditor.prototype.activate = function () {
    var o = this;

    var editor = new Editor(o.r, {
        schema: memberSchema,
        doneButton: 'Add',
        done: function () {
            if (working(true)) {
                return;
            }
            Server.newMembershipNumber(function (n) {
                if (!n) {
                    alert('No membership numbers available!');
                    working(false);
                    return;
                }
                o.r.number = n;
                var timestampExpr = cfg.offlineRealTime
                    ? { dateTime: [] }
                    : cfg.offlineAsOf;
                var serverDate = { setf: [ 'entered', timestampExpr ] };
                table.members.add(null, o.r, serverDate, function (k) {
                    base.switchTo(new MemberDisplay(k));
                });
            });
        },
        cancel: home
    });

    o.appendChild(editor);
    editor.activate();
    Class.getDescription(o.r.class, gotDesc);

    function gotDesc(d) {
        var s = 'New member - ' + d;
        if (o.r.amount != undefined) {
            s += ' - ' + cfg.currencyPrefix + o.r.amount + cfg.currencySuffix;
        }
        o.titlespan.replaceChildren(s);
    }
};

NewMemberEditor.prototype.title = function () {
    var o = this;
    return (o.titlespan);
};

function MemberUpgrade(k) {
    var o = this;
    o.k = k;
    MemberUpgrade.sup.constructor.call(o,'div');
}

extend(DElement, MemberUpgrade);

MemberUpgrade.prototype.activate = function () {
    var o = this;
    table.members.get(o.k, function (r) {
        base.switchTo(
            new UpgradePicker({
                from: r.class,
                pick: function (k, rUp) {
                    if (working(true)) {
                        return;
                    }
                    r.class = rUp.to;
                    r.amount = (r.amount||0) + rUp.amount;
                    table.members.put(o.k, r, null, function (rNew) {
                        base.switchTo(new MemberDisplay(o.k));
                    });
                },
                cancel: function () {
                    base.switchTo(new MemberDisplay(o.k));
                }
            })
        )
    });
};

init.push(function memberInit() {
    table.members = new DBTable(db.reg, 'members',
        { defaults: Editor.defaults(memberSchema) }
    );
});
