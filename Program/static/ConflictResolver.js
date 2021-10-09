function ConflictListResolver(conflicts, params)
{
    var o = this;
    o.conflicts = conflicts;
    o.params = params;
    ConflictListResolver.sup.constructor.call(o, 'div');
}
extend(DElement, ConflictListResolver);

ConflictListResolver.prototype.activate = function () {
    var o = this;

    o.select(0);
};

ConflictListResolver.prototype.select = function (i) {
    var o = this;
    if (i >= o.conflicts.length) {
        o.params.done();
        return;
    }
    base.switchTo(new ConflictResolver(o.conflicts[i], {
        existingTitle: 'Existing',
        importTitle: 'Import',
        skipped: function () { o.select(i+1); },
        resolved: function () { o.select(i+1); }
    }));
};

function ConflictResolver(c, params) {
    var o = this;
    o.c = c;
    o.params = params;
    ConflictResolver.sup.constructor.call(o, 'div', {className: 'ConflictResolver'});
}

extend(DElement, ConflictResolver);

ConflictResolver.prototype.activate = function () {
    var o = this;
    var c = o.c;

    var left = c.existing;
    var right = c.import;
    o.unresolved = {};

    // Automatically resolve delete-vs-delete conflicts.
    if (left._deleted && right._deleted) {
        o.c.result._deleted = true;
        o.resolve();
        return;
    }

    base.addCancel(function () { home(); });
    o.navResolve = { label: 'Resolve', key: 'Enter',
        func: function () { o.resolve(); } };
    base.addNav([o.navResolve]);
    o.navResolve.disable();

    if (o.params.skipped) {
        base.addNav([
            { label: 'Skip', func: function () { o.skip(); } }
        ]);
    }

    var conflictTable = new DElement('table', {border: 1}, tr(
        th(),
        th(),
        th(o.params.existingTitle),
        th(),
        th(o.params.importTitle)
    ));

    function emitRadio(row, rec, f, side, label) {
        var radio = new DElement('input',
            {type: 'radio', name: f, id: side+f, onchange: function () {
                c.result[f] = rec[f];
                delete o.unresolved[f];
                if (isEmpty(o.unresolved)) {
                    o.navResolve.enable();
                }
                row.removeClass('Difference');
            }});
        row.appendChild(td(radio));

        row.appendChild(
            td(new DElement('label', label, { htmlFor: side+f }))
        );
    }

    if (left._deleted || right._deleted) {
        function emitDeletedRadio(row, rec, side) {
            emitRadio(row, rec, '_deleted', side,
                rec._deleted ? 'DELETED' : 'Updated');
        }
        var row = tr();
        row.appendChild(nbsp());
        emitDeletedRadio(row, left, 'r');
        emitDeletedRadio(row, right, 'r');
        o.unresolved._deleted = true;
        row.addClass('Difference');
        conflictTable.appendChild(row);
    }

    var f;
    var displayed = {};
    var t = table[o.c.t];
    log('table', o.c.t, t);
    var schema = t ? t.schema : [];

    function emit(schemaEntry) {
        var f = schemaEntry.field;
        if (f.startsWith('_')) {
            return;
        }
        if (displayed[f]) {
            return;
        }
        displayed[f] = true;

        var row = tr();

        var label = schemaEntry.label || f;
        row.appendChild(th(label));

        function toDOM(r, e) {
            var f = e.field;
            var input = e.input || InputText;
            return r[f] != undefined ? input.toDOM(r[f], e) : nbsp();
        }
        var lf = toDOM(left, schemaEntry);
        var rf = toDOM(right, schemaEntry);
        if (left._deleted) {
            row.appendChild(td());
            row.appendChild(td());
            row.appendChild(td());
            row.appendChild(td(rf));
        } else if (right._deleted) {
            row.appendChild(td());
            row.appendChild(td(lf));
            row.appendChild(td());
            row.appendChild(td());
        } else if (equal(left[f], right[f])) {
            row.appendChild(td());
            row.appendChild(td(lf));
            row.appendChild(td());
            row.appendChild(td(rf));
            c.result[f] = left[f];
        } else {
            emitRadio(row, left, f, 'l', lf);
            emitRadio(row, right, f, 'r', rf);
            o.unresolved[f] = true;
            row.addClass('Difference');
        }
        conflictTable.appendChild(row);
    }

    schema.forEach(function (page) {
        page.forEach(function (entry) {
            if (!entry.field) {
                return;
            }
            emit(entry);
        });
    });

    for (f in left) {
        if (f in right) {
            emit({field: f});
        }
    }
    for (f in left) {
        if (!(f in right)) {
            emit({field: f});
        }
    }
    for (f in right) {
        if (!(f in left)) {
            emit({field: f});
        }
    }
    // Finally, if there were no differences then automatically resolve without
    // displaying the table.
    if (isEmpty(o.unresolved)) {
        o.resolve();
    } else {
        o.appendChild(conflictTable);
    }
};

ConflictResolver.prototype.resolve = function () {
    var o = this;
    for (var f in o.unresolved) {
        return;
    }

    function copyFieldsToResult(r) {
        for (var f in r) {
            if (f.startsWith('_')) {
                continue;
            }
            o.c.result[f] = r[f];
        }
    }

    if (o.c.result._deleted) {
        // nothing
    } else if (o.c.existing._deleted) {
        copyFieldsToResult(o.c.import);
    } else if (o.c.import._deleted) {
        copyFieldsToResult(o.c.existing);
    }

    // We set up our own DBTable object rather than using tables.* because
    // we're doing this in reaction to what's happening on the database, not
    // some operation that *we're* trying to do.  In theory there could be
    // tables that we've never heard of.
    var table = new DBTable(db.reg, o.c.t, {});
    table.put(o.c.k, o.c.result, null, function (conflict) {
        ConflictResolver.resolve(conflict, o.params.resolved);
    });
};

ConflictResolver.prototype.skip = function () {
    var o = this;
    o.params.skipped();
};

ConflictResolver.prototype.title = function () {
    var o = this;
    return ('Resolve ' + o.c.t + ' conflict...');
}

ConflictResolver.resolve = function(conflict, cb) {
    if (!conflict) {
        cb();
        return;
    }

    base.switchTo(new ConflictResolver(conflict, {
        existingTitle: 'Changed on other station',
        importTitle: 'Changed on this station',
        alertOnDelete: true,
        resolved: cb
    }));
};
