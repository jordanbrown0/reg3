var lastKey = undefined;
var lastRec = undefined;

var Member = {};

Member.name = function (r) {
    return joinTruthy([r.fname, r.lname], ' ');
};

// Member field names are all lower case, to allow AMF and AMXI
// to be case insensitive.
Member.schema = [
    [
        { title: 'Contact Info' },
        { field: 'fname', label: 'First name' },
        { field: 'lname', label: 'Last name' },
        { field: 'badge1', label: 'Badge name' },
        { field: 'badge2', label: '' },
        { field: 'organization', label: 'Organization' },
        { field: 'addr1', label: 'Address' },
        { field: 'addr2', label: '' },
        { field: 'city', label: 'City' },
        { field: 'state', label: 'State' },
        { field: 'postcode', label: 'Postcode (ZIP)' },
        { field: 'country', label: 'Country' },
        { field: 'phone', label: 'Phone', input: InputPhone },
        { field: 'notes', label: 'Notes' }
    ],
    [
        { title: 'Membership' },
        { field: 'entered', label: 'Entered', readOnly: true,
            input: InputDateTime },
        { field: 'pickedup', label: 'Picked up', readOnly: true,
            input: InputDateTime },
        { field: 'class', label: 'Class', readOnly: true,
            input: InputClassLookup },
        { field: 'amount', label: 'Amount paid', readOnly: true,
            input: InputCurrency },
        { field: 'number', label: 'Number', input: InputTextRJ },
        { field: 'transferfrom', label: 'Transferred from', readOnly: true,
            input: InputDBLookup, table: 'members', textField: Member.name
        },
        { field: 'transferto', label: 'Transferred to', readOnly: true,
            input: InputDBLookup, table: 'members', textField: Member.name
        },
        { field: 'void', label: 'Membership is void?', hidden: true,
            input: InputBool }
    ],
    [
        { title: 'Categories' },
        { field: 'categories', label: 'Categories', input: InputSelectMultiDB,
            table: 'categories', keyField: 'name', textField: 'description'}
    ]
];

// Shared between MemberEdit and MemberDisplay
// Maybe should be part of a superclass.
Member.setTitle = function () {
    var o = this;
    var title = new DElement('div');

    title.appendChild(Member.name(o.r))
    if (o.r.number) {
        title.appendChild(' ('+o.r.number+')');
    }
    title.appendChild(' - ');
    if (o.r.transferto) {
        var transferSpan = new DElement('span');
        title.appendChild('Transferred to ', transferSpan);
        Member.getName(o.r.transferto, function (name) {
            transferSpan.appendChild(name);
        });
    } else if (o.r.void) {
        title.appendChild('Void');
    } else {
        var classSpan = new DElement('span');
        title.appendChild(classSpan);
        Class.getDescription(o.r.class, function (d) {
            if (o.r.amount != undefined) {
                d += ' - ' + cfg.currencyPrefix + o.r.amount + cfg.currencySuffix;
            }
            classSpan.appendChild(d);
        });
    }

    var subtitle = new DElement('div', {className: 'AlertSubtitle'});

    if (o.r.pickedup) {
        var datestr = LDate.fromJSON(o.r.pickedup).toDisplay({seconds: false});
        subtitle.appendChild('Picked up '+datestr);
    }

    o.titleSpan.replaceChildren(title, subtitle);
};

Member.getSchema = function () {
    return Editor.getSchema('members', Member.schema);
};

Member.get = function (k, cb) {
    table.members.getOrNull(k, function (r) {
        if (r) {
            cb(r);
        } else {
            modal('Record no longer exists.', { ok: home });
        }
    });
};

Member.getName = function (k, cb) {
    table.members.getOrNull(k, function (r) {
        if (r) {
            cb(Member.name(r));
        } else {
            cb('Bad: '+k);
        }
    });
};

Member.put = function (k, r, expr, cb) {
    table.members.put(k, r, expr, function (conflict) {
        ConflictResolver.resolve(conflict, cb);
    });
};

Member.putAndDisplay = function (k, r, expr) {
    Member.put(k, r, expr, function () {
        Member.display(k);
    });
};

Member.display = function (k) {
    base.switchTo(new MemberDisplay(k));
};

function MemberManager() {
    var o = this;
    MemberManager.sup.constructor.call(o, 'div', {className: 'MemberManager' });

    o.list = new List({
        table: table.members,
        limit: 15,
        summarize: function (k, r) {
            var status;
            if (r.transferto) {
                status = 'T';
            } else if (r.void) {
                status = 'X';
            } else if (r.pickedup) {
                status = '*';
            } else {
                status = '';
            }

            var name = joinTruthy([ r.lname, r.fname ], ', ');
            var badge = joinTruthy([ r.badge1, r.badge2 ], ' ');
            if (badge) {
                name = joinTruthy([name, '(' + badge + ')'], ' ');
            }
            var s = joinTruthy([ name, r.organization, r.addr1, r.city ],
                ' / ');

            return (tr({className: r.void ? 'Void' : 'Active'},
                td(status, { id: 'status' }),
                td(r.class, { id: 'class' }),
                td(r.number||'', { id: 'number' }),
                td(s, { id: 'summary' })
            ));
        },
        footer: tr({ id: 'footer' },
            td({colSpan: 100}, '* picked up / T transferred / X void')
        ),
        pick: function (k) {
            Member.display(k);
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
    var schema = Member.getSchema();

    Member.get(o.k, gotRec);

    function gotRec(r) {
        o.r = r;

        lastKey = o.k;
        lastRec = r;

        o.setTitle();

        if (!r.void) {
            base.addNav([{
                label: 'Change',
                key: 'Enter',
                order: 1,
                func: function () {
                    if (working(true)) {
                        return;
                    }
                    base.switchTo(new MemberEdit(o.k));
                }
            }]);
            if (cfg.offlinePrint) {
                base.addNav([{
                    label: '&Print',
                    func: function () {
                        if (working(true)) {
                            return;
                        }
                        o.print(home);
                    }
                }]);
            } else if (!r.pickedup && cfg.offlineMarkPickedUp) {
                base.addNav([{
                    label: '&Picked Up',
                    func: function () {
                        if (working(true)) {
                            return;
                        }
                        o.markPickedUp(function () {
                            Member.display(o.k);
                        });
                    }
                }]);
            }

            if (r.pickedup) {
                base.addNav([{
                    label: 'Un-pick-up',
                    perms: 'unmark',
                    order: 70,
                    func: function () {
                        if (working(true)) {
                            return;
                        }
                        o.unmark(function () {
                            Member.display(o.k);
                        });
                    }
                }]);
            }

            base.addNav([{
                label: '&Upgrade',
                perms: 'upgrade',
                func: function () {
                    base.switchTo(new MemberUpgrade(o.k));
                }
            }]);

            base.addNav([{
                label: '&Transfer',
                perms: 'transfer',
                func: function () {
                    base.switchTo(new MemberTransfer(o.k, o.r));
                }
            }]);
        }
        if (r.void) {
            base.addNav([{
                label: 'Unvoid',
                perms: 'void',
                order: 80,
                func: function () {
                    modal('Return this membership to being active?', {
                        ok: function () {
                            if (working(true)) {
                                return;
                            }
                            o.setVoid(false, function () {
                                Member.display(o.k);
                            });
                        },
                        cancel: function () {}
                    });
                }
            }]);
        } else {
            base.addNav([{
                label: 'Void',
                perms: 'void',
                order: 80,
                func: function () {
                    modal('Mark this membership as void?', {
                        ok: function () {
                            if (working(true)) {
                                return;
                            }
                            o.setVoid(true, function () {
                                Member.display(o.k);
                            });
                        },
                        cancel: function () {}
                    });
                }
            }]);
        }

        var editor = new Editor(r, {
            schema: schema,
            readOnly: true,
            cancel: home,
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
        Member.put(o.k, o.r, serverDate, cb);
        return;
    }
    cb();
}

MemberDisplay.prototype.unmark = function (cb) {
    var o = this;

    if (o.r.pickedup) {
        o.r.pickedup = '';
        Member.put(o.k, o.r, null, cb);
        return;
    }
    cb();
};

MemberDisplay.prototype.setVoid = function (v, cb) {
    var o = this;

    o.r.void = v;
    Member.put(o.k, o.r, null, cb);
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
    var schema = Member.getSchema();

    Member.get(o.k, gotRec);

    function gotRec(r) {
        o.r = r;
        o.setTitle();
        o.editor = new Editor(r, {
            schema: schema,
            correctionsTable: 'members',
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
        Member.putAndDisplay(o.k, o.r, null);
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
        },
        help: 'NewMemberClassPicker'
    }))
    ;
};

function NewMemberEditor(r) {
    var o = this;
    o.classInfo = new DElement('span');
    o.r = r;
    NewMemberEditor.sup.constructor.call(o,'div');
}
extend(DElement, NewMemberEditor);

NewMemberEditor.prototype.activate = function () {
    var o = this;
    var schema = Member.getSchema();

    var editor = new Editor(o.r, {
        schema: schema,
        correctionsTable: 'members',
        doneButton: 'Add',
        done: function () {
            if (working(true)) {
                return;
            }
            o.add(function (k) {
                Member.display(k);
            });
        },
        cancel: home
    });

    if (lastRec) {
        base.addNav([{
            label: 'Same address',
            key: 'ControlS',
            func: function () {
                editor.set({
                    addr1: lastRec.addr1,
                    addr2: lastRec.addr2,
                    city: lastRec.city,
                    state: lastRec.state,
                    postcode: lastRec.postcode,
                    country: lastRec.country
                });
            }
        }]);
    }

    o.appendChild(editor);
    editor.activate();
    Class.getDescription(o.r.class, gotDesc);

    function gotDesc(d) {
        if (o.r.amount != undefined) {
            d += ' - ' + cfg.currencyPrefix + o.r.amount + cfg.currencySuffix;
        }
        o.classInfo.replaceChildren(d);
    }
};

NewMemberEditor.prototype.add = function (cb) {
    var o = this;

    if (o.r.number) {
        addRec();
    } else {
        Server.newMembershipNumber(gotNumber);
    }

    function gotNumber(n) {
        if (!n) {
            modal('No membership numbers available!', {
                ok: function () {
                    working(false);
                }
            });
            return;
        }
        o.r.number = n;
        addRec();
    }

    function addRec() {
        var timestampExpr = cfg.offlineRealTime
            ? { dateTime: [] }
            : cfg.offlineAsOf;
        var serverDate = { setf: [ 'entered', timestampExpr ] };
        table.members.add(null, o.r, serverDate, cb);
    };
};

NewMemberEditor.prototype.title = function () {
    var o = this;
    return (new DElement('span', 'New member - ', o.classInfo));
};

function MemberTransfer(k, r) {
    var o = this;
    o.rTransferFrom = r;
    var r2 = deepishCopy(r);
    delete r2.lname;
    delete r2.fname;
    delete r2.addr1;
    delete r2.addr2;
    delete r2.city;
    delete r2.state;
    delete r2.country;
    delete r2.postcode;
    delete r2.phone;
    delete r2.badge1;
    delete r2.badge2;
    r2.transferfrom = k;
    MemberTransfer.sup.constructor.call(o, r2);
}

extend(NewMemberEditor, MemberTransfer);

MemberTransfer.prototype.title = function () {
    var o = this;
    return (new DElement('span', 'Transfer to... - ', o.classInfo));
};

MemberTransfer.prototype.add = function () {
    var o = this;

    // First, add the new record.
    MemberTransfer.sup.add.call(o, function (k) {
        // The new record has been added, and its key is k.
        // Record that as the transfer-to of the old record, and mark it void.
        o.rTransferFrom.transferto = k;
        o.rTransferFrom.void = true;
        // Write the old record.
        Member.put(o.r.transferfrom, o.rTransferFrom, null, function () {
            // Continue on to edit the new record.
            Member.display(k);
        });
    });
};

function MemberUpgrade(k) {
    var o = this;
    o.k = k;
    MemberUpgrade.sup.constructor.call(o,'div');
}

extend(DElement, MemberUpgrade);

MemberUpgrade.prototype.activate = function () {
    var o = this;
    Member.get(o.k, function (r) {
        base.switchTo(
            new UpgradePicker({
                member: r,
                pick: function (k, rUp) {
                    if (working(true)) {
                        return;
                    }
                    r.class = rUp.to;
                    r.amount = (r.amount||0) + rUp.amount;
                    Member.putAndDisplay(o.k, r, null);
                },
                cancel: function () {
                    Member.display(o.k);
                }
            })
        )
    });
};

// NEEDSWORK:  dynamically added fields
init.push(function memberInit() {
    table.members = new DBTable(db.reg, 'members',
        { schema: Member.schema }
    );
});
