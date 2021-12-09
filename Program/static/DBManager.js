function DBEdit(k, params) {
    var o = this;

    DBEdit.sup.constructor.call(o,'div');
    o.k = k;
    o.params = params;
    if (o.params.help) {
        o.help = o.params.help;
    }
}
extend(DElement, DBEdit);

DBEdit.prototype.activate = function () {
    var o = this;

    o.get(function (r) {
        o.r = r;
        if (o.params.keyField) {
            Editor.setReadOnly(o.params.schema, o.params.keyField, true);
        }
        var editor = new Editor(r, {
            schema: o.params.schema,
            doneButton: 'Save',
            done: function () {
                if (working(true)) {
                    return;
                }
                o.put(function () { o.done(); });
            },
            cancel: function () { o.cancel(); }
        });
        o.appendChild(editor);
        editor.activate();
        if (o.params.canDelete) {
            base.addNav([
                { label: 'Delete', func: function () {
                    if (working(true)) {
                        return;
                    }
                    o.delete(function (deleted) { o.done(); });
                }}
            ]);
        }
        if (o.params.canSaveCopy) {
            base.addNav([
                { label: 'Save Copy', func: function () {
                    if (working(true)) {
                        return;
                    }
                    if (editor.get()) {
                        o.add(home);
                    }
                }}
            ]);
        }
    });
};

DBEdit.prototype.get = function (cb) {
    var o = this;
    o.params.table.getOrNull(o.k, function (r) {
        if (r) {
            cb(r);
        } else {
            modal('Record has been deleted on another station.', { ok: home });
        }
    });
};

DBEdit.prototype.getOrAdd = function (cb) {
    var o = this;
    o.params.table.getOrAdd(o.k, {}, null, cb);
};

DBEdit.prototype.put = function (cb) {
    var o = this;
    o.params.table.put(o.k, o.r, null, function (conflict) {
        ConflictResolver.resolve(conflict, cb);
    });
};

DBEdit.prototype.done = function () {
    var o = this;
    if (o.params.reconfig) {
        Config.get(function () {
            home();
        });
    } else {
        home();
    }
};

DBEdit.prototype.cancel = function () {
    home();
};

DBEdit.prototype.delete = function (cb) {
    var o = this;
    modal("Really delete this record?", {
        ok: function () {
            o.params.table.delete(o.k, o.r, function (conflict) {
                if (conflict) {
                    ConflictResolver.resolve(conflict, function (res) {
                        if (res._deleted) {
                            cb(true);
                        } else {
                            cb(false);
                        }
                    });
                } else {
                    cb(true);
                }
            });
        },
        cancel: function () { cb(false); }
    });
};

DBEdit.prototype.add = function (cb) {
    var o = this;
    o.params.table.add(null, o.r, null, cb);
};

DBEdit.prototype.title = function () {
    var o = this;
    return (o.params.titleEdit);
};

// Perhaps this should be a subclass of DBEdit.
function DBAdd(params) {
    var o = this;
    DBAdd.sup.constructor.call(o,'div');
    o.params = params;
    if (o.params.help) {
        o.help = o.params.help;
    }
}
extend(DElement, DBAdd);

DBAdd.prototype.activate = function () {
    var o = this;

    o.r = {};
    o.params.table.applyDefaults(o.r);
    if (o.params.keyField) {
        Editor.setReadOnly(o.params.schema, o.params.keyField, false);
    }
    var editor = new Editor(o.r, {
        schema: o.params.schema,
        doneButton: 'Add',
        done: function () {
            if (working(true)) {
                return;
            }
            o.add(function (k) { o.done(); });
        },
        cancel: function () { o.cancel(); }
    });
    o.appendChild(editor);
    editor.activate();
};

DBAdd.prototype.add = function (cb) {
    var o = this;
    var key = o.params.keyField ? o.r[o.params.keyField] : null;
    o.params.table.add(key, o.r, null, cb);
};

DBAdd.prototype.done = function () {
    home();
};

DBAdd.prototype.cancel = function () {
    home();
};

DBAdd.prototype.title = function () {
    var o = this;
    return (o.params.titleAdd);
};

function DBManager(params) {
    var o = this;
    assertParams(params, 'table');

    o.params = params;
    if (o.params.help) {
        o.help = o.params.help;
    }
    DBManager.sup.constructor.call(o, 'div');
    o.addClass(getClassName(o));
}
extend(DElement, DBManager);

DBManager.prototype.Edit = DBEdit;
DBManager.prototype.Add = DBAdd;

DBManager.prototype.activate = function () {
    var o = this;
    list = new List({
        table: o.params.table,
        filter: o.getFilter(),
        summarize: function (k, r) { return (o.summarize(k, r)); },
        header: o.header(),
        pick: function (k, r) { o.pick(k, r); },
        sort: o.sort,
        cancel: function () { o.cancel(); },
        limit: 20
    });
    o.appendChild(list);
    if (o.params.canShowAll) {
        var allText = new DElement('span', 'All');
        base.addNav([
            { label: allText, func: function () {
                if (list.getFilter()) {
                    allText.removeChildren();
                    allText.appendChild('Limit');
                    list.setFilter(null);
                } else {
                    list.setFilter(o.getFilter());
                    allText.removeChildren();
                    allText.appendChild('All');
                }
                list.refresh();
            } }
        ]);
    }
    if (o.params.canAdd) {
        base.addNav([
            { label: 'Add', func: function () { o.add(); } }
        ]);
    }
    list.activate();
};

DBManager.prototype.title = function () {
    var o = this;
    return (o.params.titleManager);
};

DBManager.prototype.getFilter = function () {
    var o = this;
    return (undefined);
};

DBManager.prototype.summarize = function (k, r) {
    return (r.values().join(' / '));
};

DBManager.prototype.pick = function (k, r) {
    var o = this;
    var params = Object.assign({}, o.params, {
        help: o.params.helpEdit
    });
    base.switchTo(new o.Edit(k, params));
};

DBManager.prototype.add = function () {
    var o = this;
    var params = Object.assign({}, o.params, {
        help: o.params.helpAdd || o.params.helpEdit
    });
    base.switchTo(new o.Add(params));
};

DBManager.prototype.cancel = function () {
    home();
};

DBManager.prototype.header = function () {
    return (null);
};

// Default is no sorting.
DBManager.prototype.sort = null;
