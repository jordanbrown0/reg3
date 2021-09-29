// var masterlog = new Log();
// masterlog.show();

// function log(msg)
// {
	// masterlog.log(msg);
// }

// function error(msg)
// {
	// masterlog.log(msg);
	// masterlog.show();
// }

var masterlog = null;	// dummy
function log() {
	console.log.apply(console, arguments);
}

function error() {
	log.apply(undefined, arguments);
}

function LogButton() {
	this.n = document.createElement('span');
}

function runcallback(func)
{
	// try {
		func(Array.prototype.slice.call(arguments, 1));
	// } catch (e) {
		// error('Exception while processing callback: '+e);
	// }
}

function assert(bool, msg)
{
	if (!bool) {
		throw (new Error(msg));
	}
}

function forceArray(o)
{
	if (o instanceof Array) {
		return (o);
	}
	return ([o]);
}

function joinTruthy(a, sep) {
	var a2 = [];
	for (var i = 0; i < a.length; i++) {
		if (a[i]) {
			a2.push(a[i]);
		}
	}
	return (a2.join(sep));
}

function sequence(cb, a) {
    seq1();
    return;

    function seq1() {
        var e = a.shift();
        if (!e) {
            cb();
        } else if (e instanceof Function) {
            e(seq1);
        } else {
            e.a.unshift(seq1);
            e.f.apply(null, e.a);
        }
    }
}

function extend(sup, sub) {
	sub.prototype = Object.create(sup.prototype);
	sub.prototype.constructor = sub;
	sub.sup = sup.prototype;
}

// Error doesn't subclass well, because Error() without "new" creates a new
// object.  You can't Error.call(obj, ...) to use Error() to initialize a
// different object.
function MyError(msg) {
    var o = this;
    o.message = msg;
    o.stack = (new Error()).stack;
}
extend(Error, MyError);

function merge() {
	var res = {};
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (arg) {
			for (var k in arg) {
				res[k] = arg[k];
			}
		}
	}
	return (res);
}

var cookies = null;
function cookie(name) {
	if (!cookies) {
		cookies = {};
		var a = document.cookie.split(';');
		for (var i = 0; i < a.length; i++) {
			var nv = a[i].split('=');
			cookies[nv[0]] = nv[1];
		}
	}
	return (cookies[name]);
}

function assertParams(params) {
	for (var i = 1; i < arguments.length; i++) {
		assert(params[arguments[i]], 'Missing '+arguments[i]);
	}
}

// Simple lock around "working" segments to avoid reentrancy.
// It's not mutual exclusion.  Rather, the intent is that the caller
// will ignore operations that attempt to reenter, e.g.
//     onsomething: function () {
//         if (working(true)) {
//             return;
//         }
//         ... do stuff ...
//         working(false);
//     }
// Note that this is only an issue if "stuff" is asynchronous.
// Since a very common case is to do something and then switch pages,
// Base.switchTo does working(false).

var isWorking = false;
function working(flag) {
    if (flag && isWorking) {
        return (true);
    }
    isWorking = flag;
    return (false);
}

// This creates a new object using the constructor specified and the argument
// array specified.  It works around the fact that there's no way to combine
// the "new" operator and the "apply" method.
function newApply(Cls, args) {
	if (!(args instanceof Array)) {
		args = Array.prototype.slice.call(args);
	}
	var a = [Cls].concat(args);
	var f = Function.prototype.bind.apply(Cls, a);
	return (new f());
}

function compareFunction(fields) {
    return (function compareRecsByFields(a, b) {
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            var af = a[f];
            var bf = b[f];
            if (typeof(af) == 'string') {
                af = af.toLowerCase();
            }
            if (typeof(bf) == 'string') {
                bf = bf.toLowerCase();
            }
            if (af == undefined) {
                if (bf != undefined) {
                    return (1);
                }
            } else if (bf == undefined) {
                return (-1);
            } else if (af < bf) {
                return (-1);
            } else if (af > bf) {
                return (1);
            }
        }
        return (0);
    });
}

function ArrayObject(a) {
    var o = this;
    o.array = a;
    o.length = o.array.length;
}

ArrayObject.prototype.forEach = function (cb) {
	var o = this;
    o.array.forEach(function (ent) {
		for (var k in ent) {
			cb(k, ent[k]);
		}
    });
};

ArrayObject.prototype.some = function (cb) {
    var o = this;
    return (o.array.some(function (ent) {
		for (var k in ent) {
			if (cb(k, ent[k])) {
				return (true);
			}
		}
        return (false);
    }));
};

ArrayObject.prototype.toArray = function () {
    var o = this;
    var a = [];
    o.forEach(function (k, r) {
        a.push(r);
    });
    return (a);
};

ArrayObject.prototype.pop = function () {
    var o = this;
    var e = o.array.pop();
    o.length = o.array.length;
    for (k in e) {
        return ({ key: k, obj: e[k] });
    }
};

ArrayObject.prototype.iter = function () {
    var o = this;
    return (new ArrayObjectIter(o));
};

function ArrayObjectIter(ao) {
    var o = this;
    o.ao = ao;
    o.i = 0;
}

ArrayObjectIter.prototype.next = function () {
    var o = this;
    if (o.i >= o.ao.array.length) {
        return (undefined);
    }

    var e = o.ao.array[o.i];
    o.i++;
    for (k in e) {
        return ({key: k, obj: e[k]});
    }
};

var getClassName = function (obj) {
	if (obj.constructor.name) {
		return obj.constructor.name;
	}
	const regex = new RegExp(/^\s*function\s*(\S*)\s*\(/);
	getClassName = function (obj) {
		return (obj.constructor.toString().match(regex)[1]);
	};
	return (getClassName(obj));
};

function isEmpty(obj) {
    for (var f in obj) {
        return false;
    }
    return true;
}

function deepishCopy(obj) {
    if (obj instanceof Function) {
        return obj;
    }
    if (obj instanceof Array) {
        var a = [];
        for (var i in obj) {
            a[i] = deepishCopy(obj[i]);
        }
        return a;
    }
    if (obj instanceof Object) {
        var newobj = {};
        for (var k in obj) {
            newobj[k] = deepishCopy(obj[k]);
        }
        return newobj;
    }
    return obj;
}

// --- Polyfills ---

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) {
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
}

if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            var pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) { start = 0; }
    return this.indexOf(search, start) !== -1;
  };
}


if (!Array.prototype.includes) {
    Array.prototype.includes = function (item) {
        var o = this;
        return (o.some(function (ent) { return (ent == item); }));
    }
}
