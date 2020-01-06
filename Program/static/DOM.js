// DOM management library
// Largely wrappers around the base objects, but as classes that can
// be subclassed and have new methods added.

// Wrap a DNode around a DOM Node
function DNode(n)
{
    this.n = n;
}

DNode.prototype.activate = function () {
};

DNode.verbose = false;
DNode.log = function () {
	if (DNode.verbose) {
		log.apply(undefined, arguments);
	}
}

function DText(s)
{
    DNode.call(this, document.createTextNode(s));
    DNode.log('DText '+s);
}
extend(DNode, DText);

DText.prototype.toString = function () {
    return ('DText(\''+this.n.textContent+'\')');
};

// This would be more satisfying if if didn't have the <span>,
// but so far I haven't found a good way to generate a text node
// containing an entity reference.
function EntityNode(s)
{
    var o = this;
	DNode.call(this, document.createElement('span'));
	this.n.innerHTML = '&' + s + ';';
}
extend(DNode, EntityNode);

// DElement(Node)
// DElement(type, [ attrs | child | string ] ... )
function DElement()
{
    // Cheesy overloading.
    if (arguments[0] instanceof Node) {
        DElement.Node.apply(this, arguments);
    } else {
        DElement.type.apply(this, arguments);
    }
}
extend(DNode, DElement);

// Create a DElement based on a Node
DElement.Node = function (node) {
    DElement.sup.constructor.call(this, node);
};

// Create a DElement based on a type and optionally children or attributes.
// Is there really value to adding attributes here?  Would it be more useful to set
// properties?  When do you need attributes and properties can't do the job?
DElement.type = function(type /* , [attrs | child | string ] ... */) {
    DNode.call(this, document.createElement(type));
    DNode.log('DElement '+type);

    for (var i=1; i < arguments.length; i++) {
        if (arguments[i] instanceof DNode
			|| arguments[i] instanceof Array
			|| ! (arguments[i] instanceof Object)) {
            this.appendChild(arguments[i]);
        } else {
			DNode.log('DElement setprops');
            this.setProperties(arguments[i]);
        }
    }
};

// Set properties on an element node.
// I don't *think* that text elements have properties.  If they do,
// then this should move to DNode.
DElement.prototype.setProperties = function(props) {
	for (var i in props) {
		this.n[i] = props[i];
	}
};

DElement.prototype.setProperty = function (p, v) {
	this.n[p] = v;
};

DElement.prototype.getProperty = function (p) {
	return (this.n[p]);
};

// What to return for multi-child input?
// Return last child is like base, but what about the other children?
// Could return array if passed array, but is that useful?
// Flattens arrays (adding all elements).  Automatically insert <span>?  <div>?
DElement.prototype.appendChild = function () {
    var ret;
    for (var i = 0; i < arguments.length; i++) {
        DNode.log(this.toString()+' appending '+arguments[i]);
        if (arguments[i] instanceof Array) {
            ret = this.appendChild.apply(this, arguments[i]);
        } else if (arguments[i] instanceof DNode) {
            this.n.appendChild(arguments[i].n);
            ret = arguments[i];
		} else {
			this.appendChild(new DText(arguments[i]));
        }
    }
    return (ret);
};

// Merge with setAttributes?
DElement.prototype.setAttribute = function (name, val) {
	DNode.log('setAttribute('+name+', '+val+')');
    this.n.setAttribute(name, val);
};

// Allow more than one object?
// But:  that's equivalent to one larger object, or to multiple
// calls, so not very exciting.
DElement.prototype.setAttributes = function (attrs) {
    for (var a in attrs) {
        this.setAttribute(a, attrs[a]);
    }
};

// What to return?  Returning last child is sort of like the base removeChild
// but doesn't seem very useful.  Return an array if passed an array?
// Should probably parallel appendChild.
DElement.prototype.removeChild = function () {
    var ret;
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] instanceof Array) {
            ret = this.removeChild.apply(this, arguments[i]);
        } else {
            this.n.removeChild(arguments[i].n);
            ret = arguments[i];
        }
    }
    return (ret);
};

// Maybe this is removeChild() with no arguments.
DElement.prototype.removeChildren = function () {
    while (this.n.lastChild) {
        this.n.removeChild(this.n.lastChild);
    }
};

DElement.prototype.toString = function () {
    return ('<'+this.n.nodeName+'>');
};

DElement.prototype.focus = function () {
	this.n.focus();
};

// Set the class(es) of the element.
// arguments:  strings or  arrays of strings
DElement.prototype.setClass = function () {
	var tmp = {};
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (arg instanceof Array) {
			arg.forEach(function (c) { tmp[c] = null; });
		} else {
			tmp[arg] = null;
		}
	}
	this.setProperty('className', Object.keys(tmp).join(' '));
};

// Add the specified class(es) to the classes of the element
// arguments:  strings or arrays of strings
DElement.prototype.addClass = function () {
	var tmp = {};
	this.getClass().forEach(function (c) { tmp[c] = null; });
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (arg instanceof Array) {
			arg.forEach(function (c) { tmp[c] = null; });
		} else {
			tmp[arg] = null;
		}
	}
	this.setProperty('className', Object.keys(tmp).join(' '));
};

// Remove the specified class(es) from the classes of the element
// arguments:  strings or arrays of strings
DElement.prototype.removeClass = function (c) {
	var tmp = {};
	this.getClass().forEach(function (c) { tmp[c] = null; });
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (arg instanceof Array) {
			arg.forEach(function (c) { delete tmp[c]; });
		} else {
			delete tmp[arg];
		}
	}
	this.setProperty('className', Object.keys(tmp).join(' '));
};

// Return the class(es) of the element as an array of strings.
DElement.prototype.getClass = function () {
	var c = this.getProperty('className');
	if (c) {
		return (c.split(' '));
	} else {
		return ([]);
	}
};

DElement.prototype.replaceChild = function (newNode, oldNode) {
	var o = this;
	return (o.n.replaceChild(newNode.n, oldNode.n));
}