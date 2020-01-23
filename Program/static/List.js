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

	o.searchbox = new DElement('input', {
		type: 'text',
		value: '',
		id: 'search',
		oninput: function() {
			o.search = this.value.split(' ');
			o.refresh();
		},
	});
	o.appendChild(o.searchbox);

    o.table = new DElement('table', {border: 1});
	o.appendChild(o.table);
}
extend(DElement, List);

List.prototype.activate = function () {
	var o = this;
	base.addNav([
		{ key: 'ArrowDown', func: function () { o.next(); } },
		{ key: 'ArrowUp', func: function () { o.prev(); } },
		{ key: 'Enter', func: function () { o.pick(); } },
		{ key: 'Escape', msg: 'Cancel', func: function () { o.cancel(); } }
	]);
	o.searchbox.focus();
	o.refresh();
};

List.prototype.refresh = function () {
    var o = this;
	var filter = o.params.filter
		? { and: [ o.params.filter, { match: o.search } ] }
		: { match: o.search };
	var listParams = {
		filter: filter,
		limit: o.params.limit,
		sort: o.params.sort
	};
    o.params.table.list(listParams, function (recs) {
        o.table.removeChildren();
        if (o.params.header) {
			if (o.params.header instanceof DElement) {
				o.table.appendChild(o.params.header);
			} else {
				o.table.appendChild(
					new DElement('tr',
						new DElement('th', o.params.header)
					)
				);
			}
		}
		
		function row(k, r) {
			var summary = o.params.summarize(k, r);
			var tr;
			if (summary instanceof DElement) {
				tr = summary;
			} else {
				tr = new DElement('tr', new DElement('td', summary));
			}
			tr.setProperties({ onclick: function() { o.params.pick(k, r); }});

			// NEEDSWORK this should probably be a distinct class
			return { key: k, element: tr, rec: r };
        };
		
		o.rows = [];
		forEachArrayObject(recs, function (k, r) {
			var rowObj = row(k, r);
			o.rows.push(rowObj);
			o.table.appendChild(rowObj.element);
        });
		if (o.rows.length == 0) {
			o.table.appendChild(new DElement('tr',
				new DElement('td', 'No matches')
			));
		}
        if (o.params.footer) {
			if (o.params.footer instanceof DElement) {
				o.table.appendChild(o.params.footer);
			} else {
				o.table.appendChild(
					new DElement('tr',
						new DElement('td', o.params.footer)
					)
				);
			}
		}
		if (o.rows.length == 1) {
			o.select(0);
		} else {
			o.select(null);
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
		o.rows[o.selected].element.setAttribute('class', '');
	}
	if (n != null) {
		o.rows[n].element.setAttribute('class', 'Selected');
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