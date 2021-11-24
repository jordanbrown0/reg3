// expression structure:
// { verb: arg, ... }
// A expression is true if the verb returns true.
// It is undefined to specify more than one verb; use the "and" or "or"
// verbs.
import { assert, mkdate, log } from './utils.js';
import { Debug } from './Debug.js';
import * as path from 'path';

function Expression(e, params) {
    var o = this;
    o.e = e;
    o.params = params || {};
    o.variables = o.params.init || {};
}

Expression.prototype.exec = function (r, e) {
    var o = this;
    if (arguments.length == 1) {
        e = o.e;
    }
    if (e instanceof Array) {
        e = { array: e };
    }
    if (e instanceof Object) {
        for (var verb in e) {
            assert(verbs[verb], 'Unknown verb "'+verb+'"');
            var args = e[verb];
            if (!(args instanceof Array)) {
                args = [ args ];
            }
            Debug.expr('verb', verb, args);
            var ret = verbs[verb].call(o, r, args);
            Debug.expr('verb', verb, '=>', ret);
            return (ret);
        }
        throw new Error('Expression without verb');
    }
    // NEEDSWORK:  should an undefined expression be true, or false?  It's currently falsey,
    // because it falls through here and returns undefined.
    Debug.expr('constant', e);
    return (e);
};

Expression.prototype.getVariables = function () {
    var o = this;
    return (o.variables);
};

var verbs = {};

// { c: [ constant ]}
// The "c" verb returns a constant value.  Note that the argument is *not*
// evaluated as an expression.
// Mostly this verb is not necessary, because constants are evaluated as
// themselves.
// Note that the evaluator wraps scalars in an array before passing them to
// the verb.  This means that if the intent is for the caller to supply an
// array, the argument must be specified as an array with arg[0] being the
// array desired.  This allows distinguishing a scalar from an array containing
// one scalar.  {c: scalar} and {c: [ scalar ]} both represent one scalar,
// while {c: [[scalar]]} represents an array of one scalar.  Although we could
// disambiguate [x,y] as an array we do not, to avoid pitfalls associated with
// the case of a single member.
verbs.c = function (r, args) {
    var o = this;
    var constant = args[0];
    return (constant);
};

// { f: [ field-name ] }
// Returns the value of the specified field.
verbs.f = function (r, args) {
    var o = this;
    var name = o.exec(r, args[0]);
    return (r[name]);
};

// { setf: [ field-name, val ] }
// Sets the specified field to the specified value.
// Returns the value.
// Does NOT write the record to persistent storage!
// Does NOT bump the record version!
// Does, however, mark the record as dirty.
verbs.setf = function (r, args) {
    var o = this;

    var name = o.exec(r, args[0]);
    var val = o.exec(r, args[1]);

    r[name] = val;
    r._dirty = true;
    return (val);
};

// { and: [ expression, ... ] }
// The "and" verb returns the first of its arguments that is falsey,
// or its last argument.  With no arguments, returns true.
// Null arguments are ignored.
// Arguments after the first falsey argument are not evaluated.
verbs.and = function (r, expressions) {
    var o = this;
    var v = true;
    for (var i = 0; i < expressions.length; i++) {
        var e = expressions[i];
        if (e !== null) {
            v = o.exec(r, e);
            if (!v) {
                return (v);
            }
        }
    }
    return (v);
};

// { or: [ expression, ... ] }
// The "or" verb returns the first of its arguments that is truthy,
// or its last argument.  With no arguments, returns false.
// Null arguments are ignored.
// Arguments after the first truthy argument are not evaluated.
verbs.or = function (r, expressions) {
    var o = this;
    var v = false;
    for (var i = 0; i < expressions.length; i++) {
        var e = expressions[i];
        if (e !== null) {
            v = o.exec(r, e);
            if (v) {
                return (v);
            }
        }
    }
    return (v);
};

// { not: [ expression ] }
// The "not" verb returns true if the argument is false, and vice versa.
verbs.not = function (r, args) {
    var o = this;
    return (!o.exec(r, args[0]));
};

// { match: [ s, ... ] }
// The "match" verb returns true if the record contains all of the
// strings in the pattern.
// Arguments are not evaluated after one that is not found.
verbs.match = function (r, args) {
    var o = this;
    // NEEDSWORK:  for (micro?)optimization, we might want to treat the
    // arguments to this function as constants.  It would be nice to be able
    // to evaluate them once, before scanning the table, but that's not
    // possible when this verb is embedded in a general expression.
    for (var i = 0; i < args.length; i++) {
        var pat = o.exec(r, args[i]).toLowerCase();
        var found = false;
        for (var f in r) {
            if (f.startsWith('_')) {
                continue;
            }
            var v = r[f];
            if (typeof(v) == 'string') {
                if (v.toLowerCase().includes(pat)) {
                    found = true;
                    break;
                }
            } else if (typeof(v) == 'number') {
                // Note that v (the value from the record) is
                // a number, but pat (the search parameter) is
                // a string, so this needs to be ==.
                if (v == pat) {
                    found = true;
                    break;
                }
            } else if (v instanceof Array) {
                if (v.some(function (av) {
                    return (typeof (av) == 'string'
                        && av.toLowerCase().includes(pat));
                })) {
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            return (false);
        }
    }
    return (true);
};

// { includes: [ a, b ] }
// Returns true if a contains b.
// All strings contain the empty string.
// If b is null or undefined, it's considered to be the empty string.
verbs.includes = function (r, vals) {
    var o = this;
    return (o.exec(r, vals[0]).includes(o.exec(r, vals[1]) || ''));
};

// { eq: [ v1, ..., vN ] }
// The "eq" verb returns true if all v[i] == v[i+1].
// Returns true if there is only one argument.
verbs.eq = function (r, vals) {
    var o = this;
    return (o.compare(r, vals, function (a, b) {
        return (a == b);
    }));
};

// { gt: [ v1, ..., vN ] }
// The "gt" verb returns true if all v[i] > v[i+1].
// Returns true if there is only one argument.
// Non-null/empty values are greater than null/empty values.
verbs.gt = function (r, vals) {
    var o = this;
    return (o.compare(r, vals, function (a, b) {
        return (
            ( a == b ) ? false :
            ( a == null ) ? false :
            ( b == null ) ? true :
            (a > b)
        );
    }));
};

// { ge: [ v1, ..., vN ] }
// The "ge" verb returns true if all v[i] >= v[i+1].
// Returns true if there is only one argument.
// Non-null/empty values are greater than null/empty values.
verbs.ge = function (r, vals) {
    var o = this;
    return (o.compare(r, vals, function (a, b) {
        return (
            ( a == b ) ? true :
            ( a == null) ? false :
            ( b == null ) ? true :
            (a > b)
        );
    }));
};

// { lt: [ v1, ..., vN ] }
// The "lt" verb returns true if all v[i] < v[i+1].
// Returns true if there is only one argument.
// Non-null/empty values are less than null/empty values.
verbs.lt = function (r, vals) {
    var o = this;
    return (o.compare(r, vals, function (a, b) {
        return (
            ( a == b ) ? false :
            ( a == null ) ? false :
            ( b == null ) ? true :
            (a < b)
        );
    }));
};

// le: [ v1, ..., vN ]
// The "le" verb returns true if all v[i] <= v[i+1].
// Returns true if there is only one argument.
// Non-null/empty values are less than null/empty values.
verbs.le = function (r, vals) {
    var o = this;
    return (o.compare(r, vals, function (a, b) {
        return (
            ( a == b ) ? true :
            ( a == null ) ? false :
            ( b == null ) ? true :
            (a < b)
        );
    }));
};

// Given a list of values [v1, ..., vN] and a function
// op(a,b), return true if all op(v[i], v[i+1]).
// Returns true if there is only one argument.
// Does not evaluate arguments after a failing test.
Expression.prototype.compare = function (r, vals, op) {
    var o = this;
    var prev = o.exec(r, vals[0]);
    for (var i = 1; i < vals.length; i++) {
        var val = o.exec(r, vals[i]);
        if (!op(prev, val)) {
            return (false);
        }
        prev = val;
    }
    return (true);
};

// { set: [ var-name, value ] }
// The "set" verb sets the variable named arg[0] to the value arg[1].
// Returns the value.
verbs.set = function (r, args) {
    var o = this;
    var name = o.exec(r, args[0]);
    var val = o.exec(r, args[1]);
    o.variables[name] = val;
    return (val);
};

// { get: [ name ] }
// Gets the value of the specified variable.
verbs.get = function (r, args) {
    var o = this;
    var name = o.exec(r, args[0]);
    return (o.variables[name]);
};

// { addto: [ var, val, ... ] }
// The "addto" verb adds arg[1-] to the variable named by arg[0].
// It is equivalent to
//    set: [ arg0, {add: [ {get:arg0}, arg1, ..., argn ] } ]
// except that it only evaluates arg0 once.
// It returns the sum.
// Null or undefined arguments are treated as zero.
verbs.addto = function (r, args) {
    var o = this;
    var name = o.exec(r, args[0]);
    var total = 0;
    for (var i = 1; i < args.length; i++) {
        total += (o.exec(r, args[i]) || 0);
    }
    o.variables[name] = (o.variables[name] || 0) + total;
    return (o.variables[name]);
};

// { if: [ cond, if-true, if-false ] }
// The "if" verb checks arg[0], and returns arg[1] if it is truthy
// and arg[2] if it is falsey.
// Only one of arg[1] and arg[2] is evaluated.
verbs.if = function (r, args) {
    var o = this;
    var cond = o.exec(r, args[0]);
    return (o.exec(r, args[ cond ? 1 : 2 ]));
};

// { add: [ n, ... ] }
// The "add" verb returns the sum of its arguments.
// Null or undefined arguments are treated as zero.
verbs.add = function (r, args) {
    var o = this;
    var ret = 0;
    for (var i = 0; i < args.length; i++) {
        ret += (o.exec(r, args[i]) || 0);
    }
    return (ret);
};

// { concat: [ s, ... ] }
// The "concat" verb returns the concatenation of its arguments.
// Null or undefined arguments are treated as empty strings.
verbs.concat = function (r, args) {
    var o = this;
    var ret = '';
    for (var i = 0; i < args.length; i++) {
        var val = o.exec(r, args[i]);
        if (val !== null && val !== undefined) {
            ret += val;
        }
    }
    return (ret);
};

// { join: [ sep, arg1, ... ]
// Join the second and later args using the separator, if they are non-empty.
// Like [arg1, ...].join(sep) but only for truthy args.
verbs.join = function (r, args) {
    var o = this;
    let results = [];
    let sep = o.exec(r, args[0]);
    for (let i = 1; i < args.length; i++) {
        let v = o.exec(r, args[i]);
        if (v) {
            results.push(v);
        }
    }
    return (results.join(sep));
};

// { array: [ v, ... ] }
// Evaluates each argument, and returns the results as an array.
//
// Note that because the evaluator automatically wraps arrays in {array: ...},
// o.exec(r, args) will evaluate all of the arguments and return them as an
// array.  We mostly don't take advantage of this case, because it's very
// slightly more efficient to do it directly in the verb's own processing.
verbs.array = function (r, args) {
    var o = this;
    var ret = [];
    args.forEach(function (e) {
        ret.push(o.exec(r, e));
    });
    return (ret);
};

// { dateTime: [] }
// Returns the current date and time.
// This returns a string rather than a Date, because the JSON-RPC and
// JSON-DBMS values are strings.
// Format is an ISO 8601 "extended" date and time, to seconds, without
// a time zone designator.  That is, "yyyy-mm-ddThh:mm:ss" with zero padding.
verbs.dateTime = function (r, vals) {
    var o = this;
    var d = new Date();
    return (mkdate(
        d.getFullYear(), d.getMonth()+1, d.getDate(),
        d.getHours(), d.getMinutes(), d.getSeconds()
    ));
};

// { date: [] }
// Returns the current date as a string.
// Format is an ISO 8601 "extended" date, without a time zone designator.
// That is, "yyyy-mm-dd" with zero padding.
verbs.date = function (r, args) {
    var o = this;
    var d = new Date();
    return (mkdate(
        d.getFullYear(), d.getMonth()+1, d.getDate()
    ));
};

verbs.left = function (r, args) {
    var o = this;
    var s = o.exec(r, args[0]) || '';
    var n = o.exec(r, args[1]);
    return (s.slice(0, n));
};

// { date: [] }
// Returns a default name for this server as a string.
verbs.defaultServerName = function (r, args) {
    var top =
        global.process.cwd().match('(C:\\\\Users\\\\)?(.*)(\\\\Program)')[2];
    return (global.process.env.COMPUTERNAME + ' ' + top);
};

verbs.defaultConventionName = function (r, args) {
    return path.basename(path.dirname(global.process.cwd()));;
};

verbs.delete = function (r, args) {
    var version = r._version;
    for (var f in r) {
        delete r[f];
    }
    r._version = version;
    r._deleted = true;
    r._dirty = true;
    return (undefined);
};

verbs.echo = function (r, args) {
    var o = this;
    var values = []
    args.forEach(function (arg) {
       values.push(o.exec(r, arg));
    });
    log.apply(null, values);
};

export { Expression };
