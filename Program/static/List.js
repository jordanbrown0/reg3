function List(params)
{
    var o = this;
    List.sup.constructor.call(o, 'div', {className: 'List'});

    assertParams(params, 'table', 'pick', 'cancel');

    o.params = Object.assign({
        summarize: function (k, r) {
            return (r.values().join(' / '));
        },
        limit: 10
    }, params);

    o.search = [];
    o.searching = false;
    o.pending = false;

    // Note that the searchbox is greedy:  any time you try to take focus away
    // from it, it grabs the focus back.
    o.searchbox = new DElement('input', {
        type: 'text',
        value: '',
        id: 'search',
        className: 'SearchBox',
        autocomplete: 'off',
        oninput: function() {
            o.search = this.value.split(' ');
            o.refresh();
        },
        onblur: function () {
            setTimeout(function () {
                o.searchbox.focus({preventScroll: true});
            });
        }
    });
    o.appendChild('Search', o.searchbox);

    o.table = new DElement('table', {border: 1});
    o.appendChild(o.table);
}
extend(DElement, List);

List.prototype.activate = function () {
    var o = this;
    base.addCancel(function () { o.cancel(); });
    base.addNav([
        { key: 'ArrowDown', func: function () { o.next(); } },
        { key: 'ArrowUp', func: function () { o.prev(); } },
        { label: 'Pick', key: 'Enter', order: 1,
            func: function () { o.pick(); }
        }
    ]);
    o.searchbox.focus();
    o.refresh();
};

List.prototype.refresh = function () {
    var o = this;

    if (o.searching) {
        o.pending = true;
        return;
    }
    o.searching = true;
    o.pending = false;

    var filter = o.params.filter
        ? { and: [ o.params.filter, { match: o.search } ] }
        : { match: o.search };
    var listParams = {
        filter: filter,
        limit: o.params.limit+1,
        sort: o.params.sort
    };
    o.params.table.list(listParams, function (recs) {
        o.searching = false;
        if (o.pending) {
            o.refresh();
            return;
        }
        o.table.removeChildren();
        if (o.params.header) {
            if (o.params.header instanceof DElement) {
                o.table.appendChild(o.params.header);
            } else {
                o.table.appendChild(tr(th(o.params.header)));
            }
        }

        function row(k, r) {
            var summary = o.params.summarize(k, r);
            var contents;
            if (summary instanceof DElement) {
                contents = summary;
            } else {
                contents = tr(td(summary));
            }
            contents.setProperties({
                onclick: function() { o.params.pick(k, r); }
            });

            // NEEDSWORK this should probably be a distinct class
            return { key: k, element: contents, rec: r };
        };

        o.rows = [];
        o.selected = null;
        var more = recs.length > o.params.limit;
        if (more) {
            recs.pop();
        }
        recs.forEach(function (k, r) {
            var rowObj = row(k, r);
            o.rows.push(rowObj);
            o.table.appendChild(rowObj.element);
        });
        if (o.rows.length == 0) {
            o.table.appendChild(tr(
                td('No matches', {
                    colSpan: 100,
                    className: 'ListNoMatches'
                })
            ));
        } else if (more) {
            o.table.appendChild(tr(
                td('More matches not shown', {
                    colSpan: 100,
                    className: 'ListMoreMatches'
                })
            ));
        } else {
            o.table.appendChild(tr(
                td('All matches shown', {
                    colSpan: 100,
                    className: 'ListAllMatches'
                })
            ));
        }
        if (o.params.footer) {
            if (o.params.footer instanceof DElement) {
                o.table.appendChild(o.params.footer);
            } else {
                o.table.appendChild(tr(td(o.params.footer, {colSpan: 100})));
            }
        }
        if (o.rows.length == 1) {
            o.select(0);
        }
    });
};

List.prototype.setFilter = function(f) {
    var o = this;
    o.params.filter = f;
};

List.prototype.getFilter = function () {
    var o = this;
    return (o.params.filter);
};


List.prototype.select = function(n) {
    var o = this;
    if (n != null && (n < 0 || n >= o.rows.length)) {
        return;
    }
    if (o.selected != null) {
        o.rows[o.selected].element.removeClass('Selected');
    }
    if (n != null) {
        o.rows[n].element.addClass('Selected');
    }
    o.selected = n;
};

List.prototype.next = function() {
    var o = this;
    var n = (o.selected == null ? 0 : o.selected + 1);
    o.select(n);
};

List.prototype.prev = function() {
    var o = this;
    var n = (o.selected == null ? o.rows.length - 1 : o.selected - 1);
    o.select(n);
};

List.prototype.pick = function() {
    var o = this;
    if (o.selected == null) {
        return;
    }
    o.params.pick(o.rows[o.selected].key, o.rows[o.selected].rec);
};

List.prototype.cancel = function () {
    var o = this;
    o.params.cancel();
};