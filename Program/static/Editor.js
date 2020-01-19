// div
//     div editor
//         <edit one page>
//     div nav
//         button prev
//         button next
//         button add/save
function Editor(r, params)
{
	var o = this;
	Editor.sup.constructor.call(o, 'div', {
		className: 'Editor',
	});
	o.r = r;
	o.params = Object.assign({
		cancelButton: 'Cancel'
	}, params);

	if (o.params.readonly) {
		o.addClass('Disabled');
	}

	o.editor = new DElement('div');	// switch_edit_page populates this
	o.appendChild(o.editor);
}
extend(DElement, Editor);

Editor.prototype.activate = function () {
	var o = this;
	base.addNav([
		{
			key: 'Enter',
			msg: o.params.doneButton,
			func: function () {
				o.done();
			}
		},
		{
			key: 'Escape',
			msg: o.params.cancelButton,
			func: function () {
				o.params.cancel();
			}
		}
	]);
	if (o.params.schema.length > 1) {
		base.addNav([
			{ key: 'PageUp', msg: '<', func:  function () { o.prev(); } },
			{ key: 'PageDown', msg: '>', func:  function () { o.next(); } }
		]);
	}
	o.pages = [];
	var prev = null;
	o.params.schema.forEach(function (pageSchema) {
		var page = new EditorPage(pageSchema, o.params);
		page.prev = prev;
		page.next = null;
		if (prev) {
			prev.next = page;
		}
		prev = page;
		o.pages.push(page);
	});
	
	// Perhaps this should be in a separate Editor.set().
	o.pages.forEach(function (page) {
		page.set(o.r);
	});

	o.switchEditPage(o.pages[0]);
};

Editor.prototype.next = function () {
	var o = this;
	o.switchEditPage(o.page.next);
};

Editor.prototype.prev = function () {
	var o = this;
	o.switchEditPage(o.page.prev);
};

// NEEDSWORK:  disable page-flip buttons at ends.
Editor.prototype.switchEditPage = function(page) {
	var o = this;
	if (!page) {
		return;
	}
	o.page = page;
	o.editor.removeChildren();
	o.editor.appendChild(page);
	page.activate();
}

Editor.prototype.done = function () {
	var o = this;

	if (o.params.readonly) {
		o.params.done();
		return;
	}
	
	var errors = o.validate();

	if (errors.length > 0) {
		// If there's an error on the current page, then stay on this page.
		var selectedError = errors.find(function (err) {
			return (err.page == o.page);
		});
		// ... and if not, switch to the first page with an error.
		selectedError = selectedError || errors[0];

		o.switchEditPage(selectedError.page);
		return;
	}

	o.pages.forEach(function (page) {
		page.get(o.r);
	});
	o.params.done();
};

Editor.prototype.validate = function () {
	var o = this;
	var errors = [];
	o.pages.forEach(function (page) {
		page.validate().forEach(function (err) { errors.push(err) });
	});
	return (errors);
};

// NEEDSWORK this should operate by calling EditorPage.defaults and thence
// EditorEntry.default.
Editor.defaults = function (schema) {
	var ret = {};
	schema.forEach(function (page) {
		page.forEach(function (ent) {
			if (ent.default !== undefined) {
				ret[ent.field] = ent.default;
			}
		});
	});
	return (ret);
};

Editor.setReadOnly = function (schema, f, ro) {
	schema.forEach(function (page) {
		page.forEach(function (ent) {
			if (ent.field == f) {
				ent.readonly = ro;
			}
		});
	});
};

function EditorPage(schema, params) {
	var o = this;
	EditorPage.sup.constructor.call(o, 'table');
	o.entries = [];
	schema.forEach(function (schemaEntry) {
		var e;
		if (schemaEntry.field) {
			e = new EditorEntry(schemaEntry, params);
			o.entries.push(e);
		} else if (schemaEntry.title) {
			e = new EditorTitle(schemaEntry);
		}
		o.appendChild(e);
	});
}
extend(DElement, EditorPage);

EditorPage.prototype.activate = function () {
	var o = this;
	// NEEDSWORK this should find the first read-write entry.
	o.entries[0].focus();
};

EditorPage.prototype.set = function (r) {
	var o = this;
	o.entries.forEach(function (e) {
		e.set(r);
	});
};

EditorPage.prototype.get = function (r) {
	var o = this;
	o.entries.forEach(function (e) {
		e.get(r);
	});
};

EditorPage.prototype.validate = function () {
	var o = this;
	var errors = [];
	o.entries.forEach(function (e) {
		e.validate().forEach(function (err) {
			err.page = o;
			errors.push(err);
		});
	});
	return (errors);
};

function EditorTitle(schema_ent)
{
	var o = this;
	EditorTitle.sup.constructor.call(o, 'tr');
	o.appendChild(new DElement('td', schema_ent.title, {
		colSpan: 3,
		className: 'Title',
		id: schema_ent.id
	}));
}
extend(DElement, EditorTitle);

function EditorEntry(schemaEntry, params)
{		
	var o = this;
	
	EditorEntry.sup.constructor.call(o, 'tr');
	o.schemaEntry = schemaEntry;
	
	o.appendChild(new DElement('td',
		schemaEntry.label || new EntityNode('nbsp'),
		{className: 'Label'}));

	o.params = merge(
		{
			input: InputText,
			id: schemaEntry.field,
			oninput: function () {
				o.input.clearError();
				o.errorMessages.removeChildren();
			}
		},
		params,
		schemaEntry
	);

	if (o.params.readonly) {
		o.addClass('Disabled');
	}
	
	o.input = new o.params.input(o.params);
	o.appendChild(new DElement('td', o.input, {className: 'Value'}));

	o.errorMessages = new DElement('td', { className: 'ErrorMessage' });
	o.appendChild(o.errorMessages);
}
extend(DElement, EditorEntry);

EditorEntry.prototype.focus = function () {
	var o = this;
	o.input.focus();
};

EditorEntry.prototype.set = function (r) {
	var o = this;
	o.input.set(r[o.schemaEntry.field]);
};

EditorEntry.prototype.get = function (r) {
	var o = this;
	// Perversely, "get" is prohibited for read-only entries because
	// "get" is the operation that writes to the record.
	if (!o.params.readonly) {
		r[o.schemaEntry.field] = o.input.get();
	}
};

EditorEntry.prototype.validate = function () {
	var o = this;
	var errors = [];
	o.errorMessages.removeChildren();
	o.input.validate().forEach(function (err) {
		o.errorMessages.appendChild(err);
		o.input.setError();
		errors.push({
			msg: err,
			input: o.input,
			entry: o
		});
	});
	return (errors);
};
