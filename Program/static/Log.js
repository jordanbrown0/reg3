// IMPORTANT:  Log must not use any variables or methods that we define, lest it be unusable in their implementation!

// NEEDSWORK:  parentelem is not implemented
// NEEDSWORK:  If Log() is instantiated before <body> loads, we end up with two bodies.

// How to make a log hide/show button:
//     o.appendChild(new DElement((new LogButton(masterlog)).element));

function Log() {
    var o = this;
    var e = document.createElement('pre');
    o.element = e;
    e.setAttribute('class', 'Log');
    o.visibilityCallbacks = [];
    o.parentelem = null;
}

Log.prototype.log = function (msg) {
    var e = this.element;
    e.appendChild(document.createTextNode(msg+'\n'));
    e.scrollTop = e.scrollHeight;
};

Log.prototype.parent = function () {
    var o = this;
    if (o.parentelem) {
        return (o.parentelem);
    }

    if (!document.body) {
        document.body = document.createElement('body');
    }

    return (document.body);
};

Log.prototype.setVisibility = function (visible) {
    var o = this;

    if (visible != o.visible()) {
        if (visible) {
            o.parent().insertBefore(o.element, o.parent().firstChild);
            o.element.scrollTop = o.element.scrollHeight;
        } else {
            o.parent().removeChild(o.element);
        }
    }

    o.visibilityCallbacks.forEach(function (cb) {
        cb(visible);
    });
};

Log.prototype.show = function (msg) {
    var o = this;
    o.setVisibility(true);
};

Log.prototype.hide = function (msg) {
    var o = this;
    o.setVisibility(false);
};

Log.prototype.toggle = function () {
    var o = this;
    if (o.visible()) {
        o.hide();
    } else {
        o.show();
    }
};

Log.prototype.visible = function () {
    var o = this;
    return (o.parent().contains(o.element));
};

Log.prototype.registerVisibilityCallback = function (f) {
    var o = this;
    o.visibilityCallbacks.push(f);
    f(o.visible());
};

function LogButton(log)
{
    var o = this;

    var refresh = function (visible) {
        if (visible) {
            c = document.createTextNode('hide log');
        } else {
            c = document.createTextNode('show log');
        }
        if (o.element.firstChild) {
            o.element.removeChild(o.element.firstChild);
        }
        o.element.appendChild(c);
    }

    o.element = document.createElement('button');
    o.element.onclick = function () {
        log.toggle();
    };
    log.registerVisibilityCallback(refresh);
}
