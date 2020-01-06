function ConflictListResolver(conflicts)
{
	var o = this;
	o.conflicts = conflicts;
    DElement.call(o, 'div');
}
extend(DElement, ConflictListResolver);

ConflictListResolver.prototype.activate = function () {
	var o = this;

	o.select(0);
};

ConflictListResolver.prototype.select = function (i) {
	var o = this;
	if (i >= o.conflicts.length) {
		home();
		return;
	}
	base.switchTo(new ConflictResolver(o.conflicts[i], {
		skipped: function () { o.select(i+1); },
		resolved: function () { o.select(i+1); }
	}));
};

function ConflictResolver(c, params) {
	var o = this;
	o.c = c;
	o.params = params;
    DElement.call(o, 'div', {className: 'ConflictResolver'});
}

extend(DElement, ConflictResolver);

ConflictResolver.prototype.activate = function () {
	var o = this;
	var c = o.c;

	base.addNav([
		{ key: 'Escape', msg: 'Cancel', func: function () { home(); } },
		{ msg: 'Resolve', func: function () { o.resolve(); } }
	]);
	if (o.params.skipped) {
		base.addNav([
			{ msg: 'Skip', func: function () { o.skip(); } }
		]);
	}
	
	var table = new DElement('table', {border: 1});
	o.appendChild(table);
	var tName = c.tName;
	var left = c.existing;
	var right = c.import;
	var f;
	o.unresolved = {};
	function emit(f) {
		if (f.startsWith('_')) {
			return;
		}
		var tr = new DElement('tr');

		tr.appendChild(new DElement('td', f));

		var lf = left[f] || new EntityNode('nbsp');
		var rf = right[f] || new EntityNode('nbsp');
		
		if (left[f] === right[f]) {
			tr.appendChild(new DElement('td'));
			tr.appendChild(new DElement('td', lf));
			tr.appendChild(new DElement('td'));
			tr.appendChild(new DElement('td', rf));
			c.result[f] = left[f];
		} else {
			function emitRadio(r, f, side, label) {
				var radio = new DElement('input',
					{type: 'radio', name: f, id: side+f, onchange: function () {
						c.result[f] = r[f];
						delete o.unresolved[f];
						tr.removeClass('Difference');
					}});
				tr.appendChild(new DElement('td', radio));

				tr.appendChild(new DElement('td', 
					new DElement('label', label, { htmlFor: side+f })
				));
			}
			
			emitRadio(left, f, 'l', lf);
			emitRadio(right, f, 'r', rf);
			o.unresolved[f] = true;
			tr.addClass('Difference');
		}
		table.appendChild(tr);
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
	table.put(o.c.k, o.c.result, null, function () {
		o.params.resolved();
	});
};

ConflictResolver.prototype.skip = function () {
	var o = this;
	o.params.skipped();
};