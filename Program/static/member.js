var Member = {};

// Shared between MemberEdit and MemberDisplay
// Maybe should be part of a superclass.
Member.setTitle = function () {
	var o = this;
	Class.getDescription(o.r.class, function (d) {
		o.titleSpan.replaceChildren(joinTruthy([o.r.first, o.r.last], ' ') +
			' - ' + d);
	});
};

function MemberManager() {
    var o = this;
	DElement.call(o, 'div', {className: 'MemberManager' });

    o.list = new List({
		table: table.members,
		summarize: function (k, r) {
			var pickupFlag = r.pickedup ? '*' : '';
			var name = joinTruthy([ r.last, r.first ], ', ');
			var badge = joinTruthy([ r.badge1, r.badge2 ], ' ');
			if (badge) {
				name = joinTruthy([name, '(' + badge + ')'], ' ');
			}
			var s = joinTruthy([ name, r.addr1, r.city ], ' / ');
			return (new DElement('tr',
				new DElement('td', pickupFlag, { id: 'pickupFlag' }),
				new DElement('td', s, { id: 'summary' })
			));
		},
		footer: new DElement('tr', { id: 'footer' },
			new DElement('td', {colSpan: 2}, '* membership has been picked up')
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
		{ title: 'Page 1' },
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
		{ title: 'Page 2' },
		{ field: 'entered', label: 'Entered', readonly: true, input: InputDateTime },
		{ field: 'pickedup', label: 'Picked up', readonly: true, input: InputDateTime },
		{ field: 'class', label: 'Class', readonly: true, input: InputClass },
		{ field: 'number', label: 'Number', readonly: true, input: InputInt }
	],
	[
		{ title: 'Page 3' },
		{ field: 'categories', label: 'Categories', input: InputSelectMultiDB,
			table: 'categories', keyField: 'name', textField: 'description'}
	]
];

function MemberDisplay(key)
{
	var o = this;
	MemberDisplay.sup.constructor.call(o,'div');
	o.key = key;
	o.titleSpan = new DElement('span');
}
extend(DElement, MemberDisplay);

MemberDisplay.prototype.activate = function () {
	var o = this;

	getAllConfig(gotConfig)
	
	function gotConfig(conf) {
		o.conf = conf;
		
		table.members.get(o.key, gotRec);
	}
	
	function gotRec(r) {
		o.r = r;

		o.setTitle();

		if (o.conf.offlinePrint) {
			base.addNav([
				{ key: 'P', msg: 'Print', func: function () {
					o.print(home);
				} }
			]);
		} else if (!r.pickedup && o.conf.offlineMarkPickedUp) {
			base.addNav([
				{ key: 'P', msg: 'Picked Up', func: function () {
					o.markPickedUp(function () {
						base.switchTo(new MemberDisplay(o.k));
					});
				} }
			]);
		}
		if (r.pickedup) {
			base.addNav([
				{ msg: 'Unmark', func: function () { o.unmark(); } }
			]);
		}
		base.addNav([
			{ key: 'C', msg: 'Change', func: function () {
				base.switchTo(new MemberEdit(o.key));
			} },
			{ key: 'U', msg: 'Upgrade', func: function () {
				base.switchTo(new MemberUpgrade(o.key));
			} }
		]);

		var editor = new Editor(r, {
			schema: memberSchema,
			readonly: true,
			cancel: home,
			done: function () {
				base.switchTo(new MemberEdit(o.key));
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
	label_badge(o.r, function () { o.markPickedUp(cb); }, function () {});
};

MemberDisplay.prototype.markPickedUp = function (cb) {
	var o = this;
	if (o.conf.offlineMarkPickedUp && !o.r.pickedup) {
		// NEEDSWORK:  as-of date.
		var serverDate = { setf: [ 'pickedup', { dateTime: [] } ] };
		table.members.put(o.key, o.r, serverDate, cb);
		return;
	}
	cb();
}

MemberDisplay.prototype.unmark = function () {
	var o = this;
	
	if (o.r.pickedup) {
		o.r.pickedup = '';
		table.members.put(o.key, o.r, null, function () {
			base.switchTo(new MemberDisplay(o.key));
		});
	}
};

function MemberEdit(key)
{
	var o = this;
	DElement.call(o,'div');
	o.key = key;
	o.titleSpan = new DElement('span');
}
extend(DElement, MemberEdit);

MemberEdit.prototype.activate = function () {
	var o = this;

	table.members.get(o.key, function (r) {
		o.r = r;
		o.setTitle();
		o.editor = new Editor(r, {
			schema: memberSchema,
			doneButton: 'Save',
			done: function () {
				table.members.put(o.key, r, null,
					function () { base.switchTo(new MemberDisplay(o.key)); }
				);
			},
			cancel: home
		});
		o.appendChild(o.editor);
		o.editor.activate();
	});
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
		pick: function (k, classrec) {
			r.class = classrec.code;
			base.switchTo(new NewMemberEditor(r));
		}
	}))
	;
};

function NewMemberEditor(r) {
	var o = this;
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
			Server.newMembershipNumber(function (n) {
				if (!n) {
					alert('No membership numbers available!');
					return;
				}
				o.r.number = n;
				// NEEDSWORK:  Use as-of date if set.
				var serverDate = { setf: [ 'entered', { dateTime: [] } ] };
				table.members.add(null, o.r, serverDate, function (k) {
					base.switchTo(new MemberDisplay(k));
				});
			});
		},
		cancel: home
	});

	o.appendChild(editor);
	editor.activate();
};

NewMemberEditor.prototype.title = function () {
	var o = this;
	var span = new DElement('span');
	Class.getDescription(o.r.class, function (d) {
		span.replaceChildren('New member - ' + d);
	});
	return (span);
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
				pick: function (newClass) {
					r.class = newClass;
					table.members.put(o.k, r, null, function () {
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