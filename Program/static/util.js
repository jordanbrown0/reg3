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
		alert(msg);
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

// Retrieve global and per-station configuration and merge them.
// Call back with the result.
function getAllConfig(cb) {
	var res = {};
	var funcs = [ Global.get, Server.get, Station.get ];
	
	function got(r) {
		Object.assign(res, r);
		var f = funcs.shift();
		if (f) {
			f(got);
		} else {
			cb(res);
		}
	}
	
	got({});
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

// Given an array of objects, call the callback for each element in each
// object.  This is intended primarily for objects that each have only
// a single element and are structured in an array to preserve order.
function forEachArrayObject(a, cb) {
	for (var i = 0; i < a.length; i++) {
		for (var k in a[i]) {
			cb(k, a[i][k]);
		}
	}
}
function someArrayObject(a, cb) {
	for (var i = 0; i < a.length; i++) {
		for (var k in a[i]) {
			if (cb(k, a[i][k])) {
				return (true);
			}
		}
	}
	return (false);
}
function onlyArrayObject(a, cb) {
	var ret_k = null;
	var ret_r = null;
	forEachArrayObject(a, function (k, r) {
		assert(ret_k == null, 'Too many objects');
		ret_k = k;
		ret_r = r;
	});
	cb(ret_k, ret_r);
}