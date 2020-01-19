function Input(params, args)
{
	var o = this;
	o.params = params;

	Input.sup.constructor.apply(o, args);

	o.setClass(getClassName(o));
	if (params.readonly) {
		o.addClass('Disabled');
	}
}
extend(DElement, Input);

Input.prototype.get = function () {
	var o = this;
	assert(!o.params.readonly, 'get of read-only input ' + o.params.id);
	return (o.n.value);
};

Input.prototype.set = function (value) {
	var o = this;
	assert(value !== null, o.params.id + ':  no value')
	this.n.value = value;
};

Input.prototype.validate = function () {
	return ([]);
};

Input.prototype.setError = function () {
	var o = this;
	o.addClass('ErrorValue');
};
Input.prototype.clearError = function () {
	var o = this;
	o.removeClass('ErrorValue');
};


function InputInput(params) {
	var o = this;
	assert(params.type,
		getClassName(o) + '#' + params.id + ':  no type specified');

	InputInput.sup.constructor.call(o, params, [
		'input',
		{
			type: params.type,
			id: params.id,
			oninput: function () {
				if (o.params.oninput) {
					o.params.oninput();
				}
			}
		}
	]);
	
	if (params.readonly) {
		o.setAttribute('readonly', '');
	}
	if (params.disabled) {
		o.setAttribute('disabled', '');
	}
}

extend(Input, InputInput);


function InputText(params) {
	var o = this;
	params.type = 'text';
	InputText.sup.constructor.call(o, params);
}
extend(InputInput, InputText);

InputText.prototype.set = function (value) {
	var o = this;
	InputText.sup.set.call(o, value || '');
};

InputText.prototype.validate = function () {
	var o = this;
	if (o.params.required && !o.n.value) {
		// NEEDSWORK this should really be concatenated with the
		// results from the superclass.
		return (["Field is required"]);
	}
	return (InputText.sup.validate.call(o));
};

// NEEDSWORK:  this undoubtedly needs some NaN support
function InputInt(params)
{
	var o = this;
	InputInt.sup.constructor.call(o, params);
}
extend(InputText, InputInt);

InputInt.prototype.get = function () {
	var o = this;
	var sval = InputInt.sup.get.call(this);
	// Note that the validator might disallow empty values.
	if (sval == null || sval == '') {
		return (null);
	} else {
		return (parseInt(sval, 10));
	}
};

InputInt.prototype.set = function (value) {
	var v = (value == undefined) ? '' : value.toString();
	InputInt.sup.set.call(this, v);
};

InputInt.prototype.validate = function () {
	var o = this;
	if (o.n.value) {
		var val = parseInt(o.n.value, 10);
		if (isNaN(val)) {
			return (["Invalid number"]);
		}
	}
	return (InputInt.sup.validate.call(o));
};

// NEEDSWORK:  this undoubtedly needs some NaN support
function InputIntList(params)
{
	var o = this;
	InputIntList.sup.constructor.call(o, params);
}

extend(InputText, InputIntList);

InputIntList.prototype.get = function () {
	var o = this;
	var svals = InputIntList.sup.get.call(o).split(',');
	var ivals = [];
	svals.forEach(function (s) {
		var v = parseInt(s, 10);
		if (!isNaN(v)) {
			ivals.push(v);
		}
	});
	return (ivals);
};

InputIntList.prototype.set = function (ivals) {
	var o = this;
	ivals = ivals || [];
	InputIntList.sup.set.call(o, ivals.join(','));
};

InputIntList.prototype.validate = function () {
	var o = this;
	var svals = InputIntList.sup.get.call(o).split(',');
	if (svals &&
		svals.some(function (s) {
			return (isNaN(parseInt(s, 10)));
		})
	) {
		return (["Invalid number"]);
	}
	return (InputIntList.sup.validate.call(o));
};

function InputBool(params)
{
	var o = this;
	params = Object.assign({}, params, { type: 'checkbox' });
	if (params.readonly) {
		params.disabled = true;
	}
	InputBool.sup.constructor.call(o, params);
}
extend(InputInput, InputBool);

InputBool.prototype.get = function () {
	var o = this;
	return (o.n.checked);
};

InputBool.prototype.set = function (value) {
	var o = this;
	o.n.checked = value;
};

function InputDate(params)
{
	var o = this;
	InputDate.sup.constructor.call(o, params);
}
extend(InputText, InputDate);

InputDate.prototype.get = function () {
	var o = this;
	var mmddyy = InputDate.sup.get.call(o).split('/');
	var m = parseInt(mmddyy[0], 10);
	var d = parseInt(mmddyy[1], 10);
	var y = parseInt(mmddyy[2], 10);
	if (y < 100) {
		y += 2000;
	}
	return (new Date(y, m-1, d));
};

InputDate.prototype.set = function (value) {
	var o = this;
	var s;
	if (value && typeof (value) == 'string') {
		value = new Date(value);
	}
	if (value instanceof Date) {
		s = (value.getMonth()+1).toString().padStart(2, '0') + '/' +
		    value.getDate().toString().padStart(2, '0') + '/' +
			value.getFullYear().toString().padStart(4, '0');
	} else {
		s = '';
	}
	InputDate.sup.set.call(o, s);
};

// CAUTION:  This isn't really appropriate for input, since it's
// kind of unpredictable what parsing it does.  Better would be to,
// sigh, break it down into individual components.
function InputDateTime(params)
{
	var o = this;
	InputDateTime.sup.constructor.call(o, params);
}
extend(InputText, InputDateTime);

InputDateTime.prototype.get = function () {
	var o = this;
	var s = InputDateTime.sup.get.call(o);
	return (s ? new Date(s) : null);
};

InputDateTime.prototype.set = function (value) {
	var o = this;
	var s;
	if (value instanceof Date) {
		s = value.toString();
	} else if (value && typeof (value) == 'string') {
		s = (new Date(value)).toString();
	} else {
		s = '';
	}
	InputDateTime.sup.set.call(o, s);
};

// <select> object aren't willing to accept values that don't
// match any of their options.  We may get our existing value
// before we get the options, so save away the existing value
// to restore once we get the options.
function InputSelect(params)
{
	var o = this;
	InputSelect.sup.constructor.call(o, params, [
		'select',
		{
			id: params.id,
			oninput: function () {
				if (o.params.oninput) {
					o.params.oninput();
				}
			},
			onchange: function () {
				o.value = o.n.value;
			}
		}
	]);
	if (params.options) {
		o.setOptions(params.options);
	}		
	
	if (params.readonly) {
		o.setAttribute('disabled', '');
	}
}
extend(Input, InputSelect);

InputSelect.prototype.set = function (val) {
	var o = this;
	InputSelect.sup.set.call(o, val);
	o.value = val;
};

InputSelect.prototype.setOptions = function (opts) {
	var o = this;
	o.removeChildren();
	opts.forEach(function (opt) {
		for (var val in opt) {
			o.appendChild(new DElement('option', { value: val }, opt[val]));
		}
	});
	o.n.value = o.value;
};

// NEEDSWORK should the filter be a parameter?  Should this just know that
// the record has a "hide" field?  The obvious answers are "yes" and "no",
// respectively.

// Params:
// table:  Either a DBTable object, or the name of a table.
// keyField:  The field to be used as the key; the value to return.
// textField:  Either the name of a field to display, or a function to evaluate
// to yield a string to display.
//
function InputDBPicker(params)
{
	var o = this;
	InputDBPicker.sup.constructor.call(o, params);
	var t = params.table;
	if (!(t instanceof DBTable)) {
		t = table[t];
	}
	t.list({ filter: { not: { f: 'hide' } } }, function (recs) {
		var opts = [];
		forEachArrayObject(recs, function (k, r) {
			var opt = {};
			var optKey = params.keyField ? r[params.keyField] : k;
			var optVal = params.textField instanceof Function
				? params.textField(r)
				: r[params.textField];
			opt[optKey] = optVal;
			opts.push(opt);
		});
		o.setOptions(opts);
	});
}
extend(InputSelect, InputDBPicker);

function InputClass(params)
{
	var o = this;
	params = Object.assign({}, params, {
		table: table.classes,
		keyField: 'code',
		textField: 'description'
	});
	InputClass.sup.constructor.call(o, params);
}
extend(InputDBPicker, InputClass);

// One might think that <select multiple> would do what we want, but I don't
// like the Ctrl/Shift-click UI at all.
function InputSelectMulti(params)
{
	var o = this;
	InputSelectMulti.sup.constructor.call(o, params, [
		'table',
		{
			id: params.id,
		}
	]);
	o.children = {};
	if (params.options) {
		o.setOptions(params.options);
	}
}
extend(Input, InputSelectMulti);

InputSelectMulti.prototype.set = function (listVal) {
	var o = this;
	for (var name in o.children) {
		o.children[name].set(false);
	}
	o.value = {};
	if (listVal) {
		listVal.forEach(function (name) {
			if (o.children[name]) {
				o.children[name].set(true);
			}
			o.value[name] = true;
		});
	}
};

InputSelectMulti.prototype.get = function (val) {
	var o = this;
	var ret = [];
	for (var name in o.children) {
		if (o.children[name].get()) {
			ret.push(name);
		}
	}
	return (ret);
};

InputSelectMulti.prototype.addOption = function (key, text) {
	var o = this;
	var boolParams = Object.assign(o.params, {
		onchange: function () {
			o.value[key] = input.get();
		}
	});
	
	var input = new InputBool(boolParams);
	o.children[key] = input;
	o.appendChild(
		new DElement('tr',
			new DElement('td', input),
			new DElement('td', text)
		)
	);	
};

InputSelectMulti.prototype.setOptions = function (opts) {
	var o = this;
	o.removeChildren();
	o.children = {};
	opts.forEach(function (opt) {
		if (opt instanceof Object) {
			for (var key in opt) {
				o.addOption(key, opt[key]);
			}
		} else {
			o.addOption(opt, opt);
		}
	});
	for (key in o.value) {
		var child = o.children[key];
		if (child) {
			child.set(true);
		}
	}
};

function InputSelectMultiDB(params) {
	var o = this;
	InputSelectMultiDB.sup.constructor.call(o, params);
	var t = params.table;
	if (!(t instanceof DBTable)) {
		t = table[t];
	}
	t.list({ filter: { not: { f: 'hide' } } }, function (recs) {
		var opts = [];
		forEachArrayObject(recs, function (k, r) {
			var opt = {};
			var optKey = params.keyField ? r[params.keyField] : k;
			var optVal = params.textField instanceof Function
				? params.textField(r)
				: r[params.textField];
			opt[optKey] = optVal;
			opts.push(opt);
		});
		o.setOptions(opts);
	});
}

extend(InputSelectMulti, InputSelectMultiDB);
