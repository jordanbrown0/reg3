function Input(content, params)
{
    var o = this;
    o.params = params;

    Input.sup.constructor.call(o, 'span');
    o.content = content;

    if (params.prefix) {
        o.appendChild(params.prefix);
    }
    o.appendChild(content);
    if (params.suffix) {
        o.appendChild(params.suffix);
    }

    o.content.setClass(getClassName(o));
    if (params.readOnly) {
        o.content.addClass('Disabled');
    }
}
extend(DElement, Input);

Input.prototype.validate = function () {
    return ([]);
};

Input.prototype.setError = function () {
    var o = this;
    o.content.addClass('ErrorValue');
};

Input.prototype.clearError = function () {
    var o = this;
    o.content.removeClass('ErrorValue');
};

Input.prototype.focus = function () {
    var o = this;
    o.content.focus();
};

Input.prototype.correct = function () {
};

Input.prototype.isEmpty = function () {
    return (false);
};

Input.toDOM = function (value, params) {
    var ret = span();
    if (params.prefix) {
        ret.appendChild(params.prefix);
    }
    ret.appendChild(value.toString());
    if (params.suffix) {
        ret.appendChild(params.suffix);
    }
    return (ret);
};


// Input widgets based on <input> elements.
function InputInput(type, params) {
    var o = this;

    var content = new DElement('input', {
        type: type,
        oninput: function () {
            if (o.params.oninput) {
                o.params.oninput();
            }
        },
        onblur: function () {
            o.correct();
        },
        onfocus: function () {
            if (!params.readOnly) {
                o.content.select();
            }
        },
        autocomplete: 'off'
    });
    if (params.id) {
        content.setProperties({id: params.id});
    }

    InputInput.sup.constructor.call(o, content, params);

    if (params.readOnly) {
        o.content.setAttribute('readOnly', '');
    }
    if (params.disabled) {
        o.content.setAttribute('disabled', '');
    }
}

extend(Input, InputInput);

InputInput.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    return (o.content.n.value);
};

InputInput.prototype.set = function (value) {
    var o = this;
    assert(value !== null, o.params.id + ':  null value')
    this.content.n.value = value;
};

InputInput.prototype.validate = function () {
    var o = this;
    if (o.params.required && !this.content.n.value) {
        return (['Required']);
    }
    return ([]);
};

function InputText(params) {
    var o = this;
    InputText.sup.constructor.call(o, 'text', params);
}
extend(InputInput, InputText);

InputText.prototype.set = function (value) {
    var o = this;
    InputText.sup.set.call(o, value == undefined ? '' : value);
};

InputText.prototype.isEmpty = function () {
    var o = this;
    var v = InputText.prototype.get.call(o);
    return (v == undefined || v == '');
};

InputText.prototype.correct = function () {
    var o = this;
    if (o.params.readOnly) {
        return;
    }
    // This explicitly calls InputText.get() instead of o.get() so that it
    // will get the text form of the value - versus, say, a number.
    var v = InputText.prototype.get.call(o);
    if (v == undefined) {
        return;
    }
    var newv = v.trim();
    if (o.params.corrections) {
        var c = o.params.corrections[newv.toLowerCase()];
        if (c) {
            newv = c;
        }
    }
    if (newv != v) {
        o.set(newv);
    }
};

function InputPhone(params) {
    var o = this;
    InputPhone.sup.constructor.call(o, params);
}

extend(InputText, InputPhone);

InputPhone.prototype.correct = function () {
    var o = this;
    if (o.params.readOnly) {
        return;
    }

    var v = o.get();
    if (v == undefined) {
        return;
    }
    var newv = v;

    var result = newv.match(
        '^ *(`?\\+?1)?[( ]*([2-9][0-9][0-9])[-/). ]*([2-9][0-9][0-9])[-. ]*([0-9][0-9][0-9][0-9]) *$');
    if (result) {
        var [ , , p1, p2, p3 ] = result;
        var newv = '+1 (' + p1 + ')' + p2 + '-' + p3;
    }

    if (newv != v) {
        o.set(newv);
    }
};

function InputInt(params)
{
    var o = this;
    InputInt.sup.constructor.call(o, params);
}
extend(InputText, InputInt);

InputInt.prototype.get = function () {
    var o = this;
    var sVal = InputInt.sup.get.call(this);
    // Note that the validator might disallow empty values.
    if (sVal === undefined) {
        return (undefined);
    } else {
        return (parseInt(sVal, 10));
    }
};

InputInt.prototype.set = function (value) {
    var o = this;
    var v = (value == undefined) ? '' : value.toString();
    InputInt.sup.set.call(this, v);
};

InputInt.prototype.validate = function () {
    var o = this;
    if (o.content.n.value) {
        var n = parseInt(o.content.n.value, 10);
        if (isNaN(n) || !o.content.n.value.match(/^-?[0-9][0-9]*$/)) {
            return (['Bad number']);
        }
        if (o.params.minimum != undefined
            && n < o.params.minimum) {
                return (['Must be ' + o.params.minimum + ' or greater']);
        }
        if (o.params.maximum != undefined
            && n > o.params.maximum) {
                return (['Must be ' + o.params.maximum + ' or less']);
        }
    }
    return (InputInt.sup.validate.call(o));
};

function InputCurrency(params) {
    var o = this;
    params = Object.assign({}, params);

    params.prefix = cfg.currencyPrefix;
    params.suffix = cfg.currencySuffix;

    InputCurrency.sup.constructor.call(o, params);
}

extend(InputInt, InputCurrency);

InputCurrency.toDOM = function (value, params) {
    params = Object.assign({}, params, {
        prefix: cfg.currencyPrefix,
        suffix: cfg.currencySuffix
    });
    return InputInt.toDOM(value, params);
};

function InputBool(params)
{
    var o = this;
    params = Object.assign({}, params);
    if (params.readOnly) {
        params.disabled = true;
    }
    InputBool.sup.constructor.call(o, 'checkbox', params);
}
extend(InputInput, InputBool);

InputBool.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    return (o.content.n.checked);
};

InputBool.prototype.set = function (value) {
    var o = this;
    o.content.n.checked = value;
};

function InputFile(params)
{
    var o = this;
    InputFile.sup.constructor.call(o, 'file', params);
}

extend(InputInput, InputFile);

InputFile.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    return (o.content.n.files.item(0));
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
    var ld = LDate.fromEditableDate(s);
    return (ld ? ld.toJSON() : undefined);
};

InputDate.prototype.validate = function () {
    var o = this;
    var s = InputDate.sup.get.call(o);
    try {
        var ld = LDate.fromEditableDate(s);
    } catch (e) {
        if (e instanceof DateParseError) {
            return ([e.message]);
        }
        throw (e);
    }
    return (InputDate.sup.validate.call(o));
};

InputDate.prototype.set = function (value) {
    var o = this;
    var s;
    assert(!(value instanceof Date), 'Not supposed to be using Date');
    if (value) {
        if (o.params.readOnly) {
            s = LDate.fromJSON(value).toDisplayDate();
        } else {
            s = LDate.fromJSON(value).toEditableDate();
        }
    } else {
        s = '';
    }
    InputDate.sup.set.call(o, s);
};

function InputDateTime(params)
{
    var o = this;
    InputDateTime.sup.constructor.call(o, params);
}
extend(InputText, InputDateTime);

InputDateTime.prototype.get = function () {
    var o = this;
    var s = InputDateTime.sup.get.call(o);
    var ld = LDate.fromEditable(s);
    return (ld ? ld.toJSON() : undefined);
};

InputDateTime.prototype.validate = function () {
    var o = this;
    var s = InputDateTime.sup.get.call(o);
    try {
        var ld = LDate.fromEditable(s);
    } catch (e) {
        if (e instanceof DateTimeParseError) {
            return ([e.message]);
        }
        throw (e);
    }
    return (InputDateTime.sup.validate.call(o));
};

InputDateTime.prototype.set = function (value) {
    var o = this;
    var s;
    assert(!(value instanceof Date), 'Not supposed to be using Date');
    if (value) {
        if (o.params.readOnly) {
            s = LDate.fromJSON(value).toDisplay({seconds: false});
        } else {
            s = LDate.fromJSON(value).toEditable();
        }
    } else {
        s = '';
    }
    InputDateTime.sup.set.call(o, s);
};

InputDateTime.toDOM = function (value, params) {
    return (LDate.fromJSON(value).toDisplay({seconds: false}));
};

// <select> objects aren't willing to accept values that don't
// match any of their options.  We may get our existing value
// before we get the options, so save away the existing value
// to restore once we get the options.
function InputSelect(params)
{
    var o = this;
    var content = new DElement('select', {
        oninput: function () {
            if (o.params.oninput) {
                o.params.oninput();
            }
        },
        onchange: function () {
            o.value = o.n.value;
        }
    });
    if (params.id) {
        content.setProperties({id: params.id});
    }

    InputSelect.sup.constructor.call(o, content, params);
    if (params.options) {
        o.setOptions(params.options);
    }

    if (params.readOnly) {
        o.content.setAttribute('disabled', '');
    }
}
extend(Input, InputSelect);

InputSelect.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    if (!o.content.n.value) {
        return (undefined);
    }
    return (o.content.n.value);
}

InputSelect.prototype.set = function (val) {
    var o = this;
    o.content.n.value = val;
    o.value = val;
};

InputSelect.prototype.validate = function () {
    var o = this;
    if (o.params.required && !this.content.n.value) {
        return (['Required']);
    }
    return ([]);
};

InputSelect.prototype.setOptions = function (opts) {
    var o = this;
    o.content.removeChildren();
    if (!(opts instanceof Array)) {
        opts = [ opts ];
    }
    opts.forEach(function (opt) {
        if (!(opt instanceof Object)) {
            var t = {};
            t[opt] = opt;
            opt = t;
        }
        for (var val in opt) {
            o.content.appendChild(new DElement('option', { value: val }, opt[val]));
        }
    });
    o.content.n.value = o.value;
};

// InputSelect.prototype.validate = function () {
    // if (o.params.required && !o.n.value) {
        // return (['Required']);
    // }
    // return (InputSelect.sup.validate.call(o));
// };

// Params:
// table:  Either a DBTable object, or the name of a table.
// keyField:  The field to be used as the key; the value to return.
// textField:  Either the name of a field to display, or a function to evaluate
// to yield a string to display.
// filter: Either an expression object, or a function that returns an expression
// object.
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
        recs.forEach(function (k, r) {
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

InputDBPicker.toDOM = function (value, params) {
    return (InputDBLookup.toDOM(value, params));
};

// Params:
// table:  Either a DBTable object, or the name of a table.
function InputFieldPicker(params)
{
    var o = this;
    InputFieldPicker.sup.constructor.call(o, params);

    var t = params.table;
    if (!(t instanceof DBTable)) {
        t = table[t];
    }
    var opts = [];
    t.fieldNames().forEach(function (f) {
        var opt = {};
        opt[f] = f;
        opts.push(opt);
    });
    o.setOptions(opts);
}
extend(InputSelect, InputFieldPicker);

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

function InputTablePicker(params)
{
    var o = this;
    InputDBPicker.sup.constructor.call(o, params);
    o.setOptions(Object.keys(table));
}
extend(InputSelect, InputTablePicker);

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
    InputDBLookup.asyncToDOM(o.t, value, o.params, function (displayValue) {
        InputDBLookup.sup.set.call(o, displayValue);
    });
};

InputDBLookup.asyncToDOM = function (t, value, params, cb) {
    t.getOrNull(value, function (r) {
        var displayValue;
        if (!r) {
            displayValue = 'Bad: '+value;
        } else if (params.textField instanceof Function) {
            displayValue = params.textField(r);
        } else {
            displayValue = r[params.textField];
        }
        cb(displayValue);
    });
};

InputDBLookup.toDOM = function (value, params) {
    var ret = span();
    var t = params.table;
    if (!(t instanceof DBTable)) {
        t = table[t];
    }

    InputDBLookup.asyncToDOM(t, value, params, function (v) {
        ret.appendChild(v);
    });
    return (ret);
};

function InputClassLookup(params)
{
    var o = this;
    params = Object.assign({}, params, {
        table: table.classes,
        textField: 'description'
    });
    InputClassLookup.sup.constructor.call(o, params);
}
extend(InputDBLookup, InputClassLookup);

InputClassLookup.toDOM = function (value, params) {
    params = Object.assign({}, params, {
        table: table.classes,
        textField: 'description'
    });
    return InputDBLookup.toDOM(value, params);
};

// One might think that <select multiple> would do what we want, but I don't
// like the Ctrl/Shift-click UI at all.
function InputSelectMulti(params)
{
    var o = this;
    var content = new DElement('table', { id: params.id });

    InputSelectMulti.sup.constructor.call(o, content, params);
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

// NEEDSWORK:  if the value supplied includes entries that aren't in the
// list of options, should the result include them?
InputSelectMulti.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    var ret = [];
    for (var name in o.children) {
        if (o.children[name].get()) {
            ret.push(name);
        }
    }
    return (ret);
};

InputSelectMulti.prototype.isEmpty = function () {
    var o = this;
    for (var name in o.children) {
        if (o.children[name].get()) {
            return (false);
        }
    }
    return (true);
};

InputSelectMulti.prototype.addOption = function (key, text) {
    var o = this;
    var boolParams = Object.assign({}, o.params, {
        onchange: function () {
            o.value[key] = input.get();
        }
    });

    var input = new InputBool(boolParams);
    o.children[key] = input;
    o.content.appendChild(
        tr(
            td(input),
            td(text)
        )
    );
};

InputSelectMulti.prototype.setOptions = function (opts) {
    var o = this;
    o.content.removeChildren();
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

InputSelectMulti.prototype.focus = function () {
    var o = this;
    for (key in o.children) {
        o.children[key].focus();
        break;
    }
};

InputSelectMulti.toDOM = function (value, params) {
    return (value.join(', '));
};

//
// Params:
// table - either a DBTable instance, or a name as a string.
// keyField - name of the field to that contains the value to include in the
// result.  Defaults to the record key.
// textField - name of the field to display, or a function(r) that returns the
// value to display.
// filter - a filter expression; include records if it evaluates truthy.
//
function InputSelectMultiDB(params) {
    var o = this;
    InputSelectMultiDB.sup.constructor.call(o, params);
    var t = params.table;
    if (!(t instanceof DBTable)) {
        t = table[t];
    }
    t.list({ filter: params.filter }, function (recs) {
        var opts = [];
        recs.forEach(function (k, r) {
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

// Value is an array of values
// params.input = an input constructor
// params.params = parameters for the input constructor
// table
//      (+) (-) summary
//      (+)
function InputMulti(params) {
    var o = this;
    var content = new DElement('table', {
        id: params.id,
    });

    InputMulti.sup.constructor.call(o, content, params);

    o.set([]);
}

extend(Input, InputMulti);

InputMulti.prototype.set = function (values) {
    var o = this;
    o.children = [];
    values.forEach(function (value) {
        var child = o.newChild();
        child.set(value);
        o.children.push(child);
    });
    o.refresh();
};

InputMulti.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    var ret = [];
    o.children.forEach(function (child) {
        ret.push(child.get());
    });
    return (ret);
};

InputMulti.prototype.newChild = function () {
    var o = this;
    return (new o.params.params.input(o.params.params || {}));
};

InputMulti.prototype.refresh = function () {
    var o = this;
    var i;
    o.content.removeChildren();
    for (i = 0; i < o.children.length; i++) {
        o.content.appendChild(o.row(i, o.children[i]));
    }
    o.content.appendChild(o.row(o.children.length));
};

InputMulti.prototype.row = function (index, child) {
    var o = this;
    var row = tr(
        td(new Button('+', {
            onclick: function () { o.add(index); }
        }), { className: 'InputMultiButton' })
    );
    if (child) {
        row.appendChild(
            td(new Button('-', {
                onclick: function () { o.remove(index); }
            }), { className: 'InputMultiButton' }),
            child
        );
    }
    return (row);
};

InputMulti.prototype.add = function (index) {
    var o = this;
    var child = o.newChild();
    o.children.splice(index, 0, child);
    o.refresh();
};

InputMulti.prototype.remove = function (index) {
    var o = this;
    o.children.splice(index, 1);
    o.refresh();
};
var cnt = 0;

InputMulti.prototype.validate = function () {
    var o = this;
    var ret = [];
    if (o.params.required && o.children.length == 0) {
        return ([ 'Required' ]);
    }
    o.children.forEach(function (child) {
        child.validate().forEach(function (e) {
            ret.push(e);
        });
    });
    return (ret);
};

InputMulti.prototype.focus = function () {
    var o = this;
    if (o.children.length > 0) {
        o.children[0].focus();
    }
};

function InputIntList(params) {
    var o = this;
    var params = Object.assign({params: {}}, params);
    params.params = Object.assign({input: InputInt}, params.params);
    InputIntList.sup.constructor.call(o, params);
}

extend(InputMulti, InputIntList);

// params.schema: array of
//      name: member name
//      input: input constructor
//      header: table header (not implemented)
// NEEDSWORK:  The structure of this, as an independent table for each
// InputObject, requires that you use CSS to arrange that an InputMultiObject
// has its columns aligned.  Cleverer might be to allow an Input to return
// an array of DElements, with private agreements on whether that array might
// be an array of <td> elements.  But not today.
function InputObject(params) {
    var o = this;
    var content = new DElement('table');
    if (params.id) {
        content.setProperties({id: params.id});
    }

    InputObject.sup.constructor.call(o, content, params);

    o.first = null;
    o.children = {};
    o.params.schema.forEach(function (schemaEnt) {
        var child = new schemaEnt.input(schemaEnt);
        if (!o.first) {
            o.first = child;
        }
        o.children[schemaEnt.field] = child;
        o.content.appendChild(child);
    });
}

extend(Input, InputObject);

InputObject.prototype.set = function (values) {
    var o = this;
    for (k in o.children) {
        o.children[k].set(values[k]);
    }
};

InputObject.prototype.get = function () {
    var o = this;
    assert(!o.params.readOnly, 'get of readOnly');
    var ret = {};
    for (k in o.children) {
        ret[k] = o.children[k].get();
    };
    return (ret);
};

InputObject.prototype.validate = function () {
    var o = this;
    var ret = [];

    for (k in o.children) {
        o.children[k].validate().forEach(function (e) {
            ret.push(e);
        });
    };
    return (ret);
};

InputObject.prototype.focus = function () {
    var o = this;
    o.first.focus();
};

InputObject.toDOM = function (value, params) {
    var ret = div();
    params.schema.forEach(function (schemaEnt) {
        var child = schemaEnt.input.toDOM(value[schemaEnt.field], schemaEnt);
        ret.appendChild(div(child));
    });
    return (ret);
};

function InputFontWeight(params) {
    var o = this;
    InputFontWeight.sup.constructor.call(o, params);
    rpc.listFontWeights(function (weights) {
        o.setOptions(weights);
    });
}

extend(InputSelect, InputFontWeight);
