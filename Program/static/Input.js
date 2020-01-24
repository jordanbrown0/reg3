function Input(params, args)
{
	var o = this;
	o.params = params;

	Input.sup.constructor.apply(o, args);

	o.setClass(getClassName(o));
	if (params.readOnly) {
		o.addClass('Disabled');
	}
}
extend(DElement, Input);

Input.prototype.get = function () {
	var o = this;
	assert(!o.params.readOnly, 'get of read-only input ' + o.params.id);
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
	
	if (params.readOnly) {
		o.setAttribute('readOnly', '');
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

function InputCurrency(params) {
    var o = this;
    InputCurrency.sup.constructor.call(o, params);
}

extend(InputInt, InputCurrency);

InputCurrency.prototype.set = function (value) {
    var o = this;
    if (value != undefined && o.params.readOnly) {
        getAllConfig(function (conf) {
            InputCurrency.sup.set.call(o,
                conf.currency_prefix + value + conf.currency_suffix);
        });
    } else {
        InputCurrency.sup.set.call(o, value);
    }
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
	if (params.readOnly) {
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
	var s = InputDate.sup.get.call(o);
	if (!s) {
		return (s);
	}
	var mmddyy = s.split('/');
	var mm = parseInt(mmddyy[0], 10);
	var dd = parseInt(mmddyy[1], 10);
	var yyyy = parseInt(mmddyy[2], 10);
	if (yyyy < 100) {
		yyyy += 2000;
	}
	// Normalize the date.  We probably don't really need to, because validation
	// shouldn't allow a date that normalizes to different values.
	var d = new Date(yyyy, mm-1, dd);
	mm = d.getMonth()+1;
	dd = d.getDate();
	yyyy = d.getFullYear();
	
	return (
		yyyy.toString().padStart(4, '0')
		+ '-'
		+ mm.toString().padStart(2, '0')
		+ '-'
		+ dd.toString().padStart(2, '0')
	);
};

InputDate.prototype.validate = function () {
	var o = this;
	var s = InputDate.sup.get.call(o);
	if (s) {
		var mmddyy = s.split('/');
		var mm = parseInt(mmddyy[0], 10);
		var dd = parseInt(mmddyy[1], 10);
		var yyyy = parseInt(mmddyy[2], 10);
		if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) {
			return (["Invalid date"]);
		}
		if (yyyy < 100) {
			yyyy += 2000;
		}
		// Normalize the date.
		var d = new Date(yyyy, mm-1, dd);
		var mm2 = d.getMonth()+1;
		var dd2 = d.getDate();
		var yyyy2 = d.getFullYear();
		if (mm != mm2 || dd != dd2 || yyyy != yyyy2) {
			return (["Invalid date"]);
		}
	}
	return (InputDate.sup.validate.call(o));
};

InputDate.prototype.set = function (value) {
	var o = this;
	var s;
	assert(!(value instanceof Date), 'Not supposed to be using Date');
	if (value) {
		if (o.params.readOnly) {
			s = displayDate(value);
		} else {
			// ECMAScript specifies that date-only strings are interpreted
			// as UTC, while date+time strings without time zone specifiers
			// are interpreted as local time.  We want to force local time.
			if (value.indexOf('T') < 0) {
				value += 'T00:00';
			}
			var d = new Date(value);
			s =	(d.getMonth()+1).toString().padStart(2, '0')
				+ '/'
				+ d.getDate().toString().padStart(2, '0')
				+ '/'
				+ d.getFullYear().toString().padStart(4, '0');
		}
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
	assert(!(value instanceof Date), 'Not supposed to be using Date');
	if (value) {
		if (o.params.readOnly) {
			s = displayDateTime(value, false);
		} else {
			s = value;
		}
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
	
	if (params.readOnly) {
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
    var filter;
    if (params.filter instanceof Function) {
        filter = params.filter(params);
    } else {
        filter = params.filter;
    }
	t.list({ filter: filter }, function (recs) {
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

function InputDBLookup(params)
{
	var o = this;
    assert(params.readOnly, 'InputDBLookup must be read-only');
	InputDBLookup.sup.constructor.call(o, params);
	o.t = params.table;
	if (!(o.t instanceof DBTable)) {
		o.t = table[o.t];
	}
}
extend(InputText, InputDBLookup);

InputDBLookup.prototype.set = function (value) {
    var o = this;
    if (!value) {
        InputDBLookup.sup.set.call(o, '');
        return;
    }
    o.t.getOrNull(value, function (r) {
        var displayValue;
        if (!r) {
            displayValue = '(missing)';
        } else if (o.params.textField instanceof Function) {
            displayValue = o.params.textField(r);
        } else {
            displayValue = r[o.params.textField];
        }
        InputDBLookup.sup.set.call(o, displayValue);
	});
};

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
