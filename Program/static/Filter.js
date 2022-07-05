function InputOperator(params) {
    var o = this;
    InputOperator.sup.constructor.call(o, params.content, params);
}
extend(Input, InputOperator);

function InputNaryOperator(params) {
    var o = this;
    var content = div();
    o.children = [];
    for (var i = 0; i < params.n; i++) {
        var child = new InputExpr({});
        content.appendChild(child);
        o.children.push(child);
    }
    InputNaryOperator.sup.constructor.call(o, {
        content: content,
        label: params.label
    });
}
extend(InputOperator, InputNaryOperator);

InputNaryOperator.prototype.get = function () {
    var o = this;
    var ret = [];
    o.children.forEach(function (child) {
        ret.push(child.get());
    });
    return (ret);
};

InputNaryOperator.prototype.set = function (value) {
    var o = this;
    assert(value.length == o.children.length, 'set with wrong number of args');
    for (var i = 0; i < value.length; i++) {
        o.children[i].set(value[i]);
    }
};

InputNaryOperator.prototype.validate = function () {
    var o = this;
    var ret = [];
    o.children.forEach(function (child) {
        child.validate().forEach(function (childRet) {
            ret.push(childRet);
        });
    });
    return (ret);
};

function InputMultiOperator(params) {
    var o = this;
    var content = new InputMulti({
        params: {
            input: InputExpr
        }
    });
    InputMultiOperator.sup.constructor.call(o, {
        content: content,
        label: params.label
    });
}
// NEEDSWORK maybe this should inherit from InputMulti
extend(InputOperator, InputMultiOperator);

InputMultiOperator.prototype.get = function () {
    var o = this;
    return (o.content.get());
};

InputMultiOperator.prototype.set = function (value) {
    var o = this;
    o.content.set(value);
};

InputMultiOperator.prototype.validate = function () {
    var o = this;
    return (o.content.validate());
};

// NEEDSWORK this seems like a hokey solution to the problem.  In particular,
// we end up with an empty <td> in the UI.  (And if borders are on, that's
// visible.  OTOH, *not* having a dummy input widget would mean having
// special cases in several places to *not* try to call it.
function InputConst(params) {
    var o = this;
    InputConst.sup.constructor.call(o, span(), params);
}
extend(Input, InputConst);

InputConst.prototype.get = function () {
    var o = this;
    return (o.params.value);
};

InputConst.prototype.set = function (value) {
    // Just ignore attempts to set.
};

function InputExpr(params) {
    var o = this;
    var options = [];
    for (var k in Filter.operations) {
        var opt = {};
        opt[k] = Filter.operations[k].label;
        options.push(opt);
    }
    o.select = new InputSelect({
        options: options,
        oninput: function () { o.replace() }
    });
    o.arg = td();
    o.child = null;
    var content = new DElement('table',
        // { border: 1 },
        tr(td(o.select), o.arg)
    );
    InputExpr.sup.constructor.call(o, content, params);
}
extend(Input, InputExpr);

InputExpr.prototype.replace = function () {
    var o = this;
    var opt = o.select.get();

    var childParams = Filter.operations[opt];
    o.child = new childParams.input(childParams);

    o.arg.replaceChildren(o.child);
};

InputExpr.prototype.get = function () {
    var o = this;
    if (!o.child) {
        return (null);
    }
    var childValue = o.child.get();
    if (!(childValue instanceof Array)) {
        childValue = [ childValue ];
    }
    var ret = {};
    ret[o.select.get()] = childValue;
    return (ret);
};

InputExpr.prototype.set = function (value) {
    var o = this;
    for (var k in value) {
        o.select.set(k);
        o.replace();
        console.log(o.child);
        o.child.set(value[k]);
    }
};

InputExpr.prototype.validate = function () {
    var o = this;

    if (!o.select.get()) {
        return (['Incomplete expression']);
    }
    return (o.child.validate());
};


var Filter = {};

Filter.compile = function (f) {
    for (var k in f) {
        var op = Filter.operations[k];
        if (op.expr instanceof Function) {
            return (op.expr(f[k]));
        } else {
            var args = [];
            f[k].forEach(function (arg) {
                args.push(Filter.compile(arg));
            });
            var expr = op.expr || k;
            var ret = {};
            ret[expr] = args;
            return (ret);
        }
    }
    throw new Error('no operator in filter');
};

Filter.operations = {
    all: {
        input: InputConst,
        label: 'All',
        value: [],
        expr: function (args) {
            return (true);
        }
    },
    and: {
        input: InputMultiOperator,
        label: 'All of'
    },
    or: {
        input: InputMultiOperator,
        label: 'Any of'
    },
    not: {
        input: InputNaryOperator,
        label: 'Not',
        n: 1
    },
    eq: {
        input: InputNaryOperator,
        label: 'Equal',
        n: 2
    },
    if: {
        input: InputNaryOperator,
        label: 'If',
        n: 3
    },
    match: {
        input: InputText,
        label: 'Match',
        expr: function (args) {
            return ({ match: args[0].split(' ') });
        }
    },
    classany: {
        input: InputMulti,
        params: {
            input: InputClass
        },
        label: 'Class any of',
        expr: function (args) {
            return ({ includes: [args, {f: 'class'}] });
        }
    },
    categoryany: {
        input: InputMulti,
        params: {
            input: InputDBPicker,
            table: 'categories',
            keyField: 'name',
            textField: 'name'
        },
        label: 'Category any of',
        expr: function (args) {
            return ({ overlaps: [args, {f: 'categories'}] });
        }
    },
    text: {
        input: InputText,
        label: 'Text',
        expr: function (args) {
            return (args[0]);
        }
    },
    number: {
        input: InputInt,
        label: 'Number',
        expr: function (args) {
            return (args[0]);
        }
    },
    field: {
        input: InputFieldPicker,
        label: 'Field',
        table: 'members',
        expr: function (args) {
            return ({f: args});
        }
    }
};

function InputFilter(params) {
    var o = this;
    InputFilter.sup.constructor.call(o, params);
    o.set({all: null});
}
extend(InputExpr, InputFilter);
