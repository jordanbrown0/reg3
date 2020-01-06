function DBManager(params) {
    var o = this;
	assertParams(params, 'table');

	o.params = params;
	DBManager.sup.constructor.call(o, 'div');
	o.addClass(getClassName(o));
	// Lazy, to avoid forward references at load time.
	DBManager.prototype.Edit = DBEdit;
	DBManager.prototype.Add = DBAdd;
}
extend(DElement, DBManager);

DBManager.prototype.activate = function () {
	var o = this;
    list = new List({
		table: o.params.table,
		filter: o.getFilter(),
		summarize: function (k, r) { return (o.summarize(k, r)); },
		header: o.header(),
		pick: function (k, r) { o.pick(k, r); },
		sort: o.sort,
		cancel: function () { o.cancel(); }
	});
    o.appendChild(list);
	if (o.params.canShowAll) {
		var allText = new DElement('span', 'All');
		base.addNav([
			{ msg: allText, func: function () {
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
			{ key: 'Add', msg: 'Add', func: function () {
				log('add');
				o.add();
			} }
		]);
	}
	list.activate();
};

DBManager.prototype.getFilter = function () {
	var o = this;
	return (o.filter);
};

DBManager.prototype.summarize = function (k, r) {
	return (r.values().join(' / '));
};

DBManager.prototype.pick = function (k, r) {
	var o = this;
	log('DBManager.pick', k, r);
	base.switchTo(new o.Edit(k, o.params));
};

DBManager.prototype.add = function () {
	var o = this;
	base.switchTo(new o.Add(o.params));
};

DBManager.prototype.cancel = function () {
	home();
};

DBManager.prototype.header = function () {
	return (null);
};

// Default is no sorting.
DBManager.prototype.sort = null;

function DBEdit(k, params) {
	var o = this;
	
	DBEdit.sup.constructor.call(o,'div');
	o.k = k;
	o.params = params;
}
extend(DElement, DBEdit);

DBEdit.prototype.activate = function () {
	var o = this;

	o.get(function (r) {
		o.r = r;
		var editor = new Editor(r, {
			schema: o.params.schema,
			doneButton: 'Save',
			done: function () { o.put(function () { o.done(); }); },
			cancel: function () { o.cancel(); }
		});
		o.appendChild(editor);
		editor.activate();
		if (o.params.canDelete) {
			base.addNav([
				{ msg: 'Delete', func: function () { o.delete(); }}
			]);
		}
	});
};

DBEdit.prototype.get = function (cb) {
	var o = this;
	o.params.table.get(o.k, cb);
};

DBEdit.prototype.getOrAdd = function (cb) {
	var o = this;
	o.params.table.getOrAdd(o.k, null, cb);
};

DBEdit.prototype.put = function (cb) {
	var o = this;
	o.params.table.put(o.k, o.r, null, cb);
};

DBEdit.prototype.done = function () {
	home();
};

DBEdit.prototype.cancel = function () {
	home();
};

DBEdit.prototype.delete = function () {
	var o = this;
	o.params.table.delete(o.k, o.r, function () { o.done(); });
};

// Perhaps this should be a subclass of DBEdit.
function DBAdd(params) {
	var o = this;
	DBAdd.sup.constructor.call(o,'div');
	o.params = params;
}
extend(DElement, DBAdd);

DBAdd.prototype.activate = function () {
	var o = this;

	o.r = {};
	var editor = new Editor(o.r, {
		schema: o.params.schema,
		doneButton: 'Add',
		done: function () { o.add(function (k) { o.done(); }); },
		cancel: function () { o.cancel(); }
	});
	o.appendChild(editor);
	editor.activate();
};

DBAdd.prototype.add = function (cb) {
	var o = this;
	o.params.table.add(null, o.r, null, cb);
};

DBAdd.prototype.done = function () {
	home();
};

DBAdd.prototype.cancel = function () {
	home();
};
