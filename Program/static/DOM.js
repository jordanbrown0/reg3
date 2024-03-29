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

DNode.prototype.deactivate = function (cb) {
    cb();
};

function DText(s)
{
    DNode.call(this, document.createTextNode(s));
    Debug.dom('DText '+s);
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

function nbsp() {
    return (new EntityNode('nbsp'));
}

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

// Create a DElement based on a type and optionally children or properties.
// Do we need to adding attributes here?  When do you need attributes and
// properties can't do the job?
DElement.type = function(type /* , [attrs | child | string ] ... */) {
    var o = this;
    Debug.dom('DElement '+type);
    DElement.sup.constructor.call(o, document.createElement(type));

    for (var i=1; i < arguments.length; i++) {
        if (arguments[i] instanceof DNode
            || arguments[i] instanceof Array
            || ! (arguments[i] instanceof Object)) {
            this.appendChild(arguments[i]);
        } else {
            Debug.dom('DElement setprops');
            o.setProperties(arguments[i]);
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
DElement.prototype.appendChild = function (/*args*/) {
    var ret;
    for (var i = 0; i < arguments.length; i++) {
        Debug.dom(this.toString()+' appending '+arguments[i]);
        if (arguments[i] instanceof Array) {
            ret = this.appendChild.apply(this, arguments[i]);
        } else if (arguments[i] instanceof DNode) {
            this.n.appendChild(arguments[i].n);
            ret = arguments[i];
        } else {
            ret = new DText(arguments[i]);
            this.n.appendChild(ret.n);
        }
    }
    return (ret);
};

// Wrapper around insertBefore.  Perhaps this should allow multiple arguments
// like appendChild does, but that doesn't naturally extend the base function
// since the base function has the new element first and then the reference
// element.  Flattens arrays.  Returns the last node inserted.
DElement.prototype.insertBefore = function (newElement, refElement) {
    var ret;
    var o = this;
    Debug.dom(o.toString() + ' inserting ' + newElement +
        ' before ' + refElement);
    if (newElement instanceof Array) {
        newElement.forEach(function (e) {
            ret = o.insertBefore(e, refElement);
        });
        return (ret);
    } else if (newElement instanceof DNode) {
        o.n.insertBefore(newElement.n, refElement.n);
        return (newElement);
    } else {
        ret = new DText(newElement);
        o.n.insertBefore(ret.n, refElement.n);
        return (ret);
    }
};

// Merge with setAttributes?
DElement.prototype.setAttribute = function (name, val) {
    Debug.dom('setAttribute('+name+', '+val+')');
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

DElement.prototype.focus = function (options) {
    this.n.focus(options);
};

DElement.prototype.select = function () {
    this.n.select();
};

DElement.prototype.scrollIntoView = function (options) {
    this.n.scrollIntoView(options);
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

DElement.prototype.replaceChildren = function (/* args */) {
    var o = this;
    o.removeChildren();
    return (o.appendChild.apply(o, arguments));
};

DElement.prototype.disable = function () {
    var o = this;
    o.n.disabled = true;
};

DElement.prototype.enable = function () {
    var o = this;
    o.n.disabled = false;
};

function DOMFunction(t) {
    window[t] = function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(t);
        return newApply(DElement, args);
    }
}

DOMFunction('td');
DOMFunction('tr');
DOMFunction('th');
DOMFunction('span');
DOMFunction('div');
