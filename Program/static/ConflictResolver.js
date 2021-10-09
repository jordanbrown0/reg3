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

    base.addCancel(function () { home(); });
    o.navResolve = { label: 'Resolve', func: function () { o.resolve(); } };
    base.addNav([o.navResolve]);
    o.navResolve.disable();

    if (o.params.skipped) {
        base.addNav([
            { label: 'Skip', func: function () { o.skip(); } }
        ]);
    }

    var table = new DElement('table', {border: 1}, tr(
        th(),
        th(),
        th(o.params.existingTitle),
        th(),
        th(o.params.importTitle)
    ));

    var left = c.existing;
    var right = c.import;
    var f;
    o.unresolved = {};

    function equalObject(a, b) {
        var e;

        // Quick short-circuit for arrays.
        if (a.length !== b.length) {
            return (false);
        }
        // Next look for properties on one but not the other.
        for (e in a) {
            if (!(e in b)) {
                return (false);
            }
        }
        for (e in b) {
            if (!(e in a)) {
                return (false);
            }
        }
        // Now compare the actual elements.
        for (e in a) {
            if (!equal(a[e], b[e])) {
                return (false);
            }
        }
        return (true);
    }
    function equal(a, b) {
        if (typeof (a) !== typeof (b)) {
            return (false);
        }
        // Note that Object includes Array.
        if (a instanceof Object && b instanceof Object) {
            return (equalObject(a, b));
        }
        return (a === b);
    }

    function emit(f) {
        if (f.startsWith('_')) {
            return;
        }
        var row = tr();

        row.appendChild(th(f));

        var lf = left[f] ? left[f].toString() : nbsp();
        var rf = right[f] ? right[f].toString() : nbsp();
        if (equal(left[f], right[f])) {
            row.appendChild(td());
            row.appendChild(td(lf));
            row.appendChild(td());
            row.appendChild(td(rf));
            c.result[f] = left[f];
        } else {
            function emitRadio(rec, f, side, label) {
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

            emitRadio(left, f, 'l', lf);
            emitRadio(right, f, 'r', rf);
            o.unresolved[f] = true;
            row.addClass('Difference');
        }
        table.appendChild(row);
    }
    for (f in left) {
        if (f in right) {
            emit(f);
        }
    }
    for (f in left) {
        if (!(f in right)) {
            emit(f);
        }
    }
    for (f in right) {
        if (!(f in left)) {
            emit(f);
        }
    }
    // Finally, if there were no differences then automatically resolve without
    // displaying the table.
    if (isEmpty(o.unresolved)) {
        o.resolve();
    } else {
        o.appendChild(table);
    }
};

ConflictResolver.prototype.resolve = function () {
    var o = this;
    for (var f in o.unresolved) {
        return;
    }
    // We set up our own DBTable object rather than using tables.* because
    // we're doing this in reaction to what's happening on the database, not
    // some operation that *we're* trying to do.  In theory there could be
    // tables that we've never heard of.  This will probably change to
    // incorporate tables.* when we bring in the edit schema for display of the
    // resolution UI.
    var table = new DBTable(db.reg, o.c.t);
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
        skipped: function () { cb(); },
        resolved: function () { cb(); }
    }));
};
