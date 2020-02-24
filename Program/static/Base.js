function Base()
{
    var o = this;
    Base.sup.constructor.call(o, 'div', {
        className: 'Base',
        // This is interesting, in that we could make it so that focusing
        // the base automatically re-focused on a field, but IE doesn't seem
        // to believe in focusing on the base.
        // tabIndex: 0,
        // onfocus: function () { console.log('Base focus'); },
        // onblur: function () { console.log('Base blur'); }
    });
    o.clock = new DElement('span', { id: 'headerClock'});
    o.title = new DElement('span', { id: 'headerTitle'});
    o.header = new DElement('div', { className: 'Header' },
        o.title,
        o.clock
    );
    o.body = new DElement('div', { className: 'Body' });
    o.active = new DElement('div');
    o.navBar = new NavBar();
    o.navKey = new NavKey();
    o.appendChild(o.header, o.body, o.navBar);
}
extend(DElement, Base);

Base.prototype.activate = function () {
    var o = this;
    o.tick();
    setInterval(function () { o.tick(); }, 60*1000);
};

Base.prototype.switchTo = function (n) {
    var o = this;
    var a = o.active;
    o.active = null;
    a.deactivate(function () {
        o.switchToNoDeactivate(n);
    });
};

Base.prototype.switchToNoDeactivate = function (n) {
    var o = this;
    o.active = n;
    o.body.replaceChildren(n);
    // Set up some default navigation.  Have Tab and Backtab use our special
    // implementation that confines them to the web page.  Default to having
    // up and down arrows do the same thing, for dBASE compatibility.  Note
    // that some pages (notably List) will override the arrow definitions.
    o.setNav([
        {
            key: 'Tab',
            func: function (e) {
                o.doTab(e);
            }
        },
        {
            key: 'ShiftTab',
            func: function (e) {
                o.doBackTab(e);
            }
        },
        {
            key: 'ArrowDown',
            func: function (e) {
                o.doTab(e);
            }
        },
        {
            key: 'ArrowUp',
            func: function (e) {
                o.doBackTab(e);
            }
        }
    ]);
    o.title.replaceChildren(n.title instanceof Function ? n.title() : n.title);
    // Caution:  n.activate may be asynchronous, and it has no done callback.
    // Perhaps it should.
    n.activate();
};

Base.prototype.addNav = function (a) {
    var o = this;
    o.navBar.add(a);
    o.navKey.add(a);
};

Base.prototype.setNav = function (a) {
    var o = this;
    o.navBar.set(a);
    o.navKey.set(a);
};

Base.prototype.tick = function () {
    var o = this;
    rpc.eval(null, {dateTime: []}, function (d) {
        o.clock.replaceChildren(LDate.fromJSON(d).toDisplay({seconds: false}));
    });
};

// We have a custom implementation of Tab and Backtab that confines them to the
// web page and doesn't let them escape out to the chrome.  Note that although
// they fully implement tabIndex>0 behavior, it has never been tested.

// IE11 helpfully sets tabIndex=0 on all elements, whether or not they are
// tab targets, so we have to filter to find appropriate tab targets.
Base.tabElements = [ 'input', 'select', 'textarea' ];

// One could figure out everything - next, prev, first, last - in one pass using
// one function, but the logic is already convoluted enough that breaking the
// forward-tab and backward-tab cases out into separate functions seems good
// for readability even though the two functions are very similar.
Base.prototype.doTab = function (e) {
    console.log('tab');
    var o = this;
    var source = e.target;
    // We'd like to use [tabIndex], and FF supplies a default tabIndex, but
    // it's a property, not an attribute, and the selector is looking for an
    // attribute.
    var list = document.querySelectorAll('*');
    list = Array.prototype.slice.call(list);
    var found = false;
    var next = null;
    var first = null;
    var maxti = 32768;
    var sti = source.tabIndex || maxti;
    var nti = maxti + 1;
    var fti = maxti + 1;
    list.some(function (elem) {
        if (elem.tabIndex == undefined
            || !Base.tabElements.includes(elem.tagName.toLowerCase())) {
            return (false);
        }
        console.log('consider', elem.tabIndex, elem);
        if (elem == source) {
            console.log('found');
            found = true;
            return (false);
        }
        if (elem.tabIndex < 0) {
            return (false);
        }
        var eti = elem.tabIndex || maxti;
        if (eti == sti) {
            if (found) {
                console.log('found next');
                next = elem;
                return (true);
            }
        } else if (eti > sti) {
            if (eti < nti) {
                next = elem;
                nti = eti;
            }
            return (false);
        }
        if (eti < fti) {
            first = elem;
            fti = eti;
        }
    });
    if (!next) {
        next = first;
    }
    if (next) {
        console.log('focus', next);
        next.focus();
    }
};

Base.prototype.doBackTab = function (e) {
    var o = this;
    var source = e.target;
    // We'd like to use [tabIndex], and FF supplies a default tabIndex, but
    // it's a property, not an attribute, and the selector is looking for an
    // attribute.
    var list = document.querySelectorAll('*');
    list = Array.prototype.slice.call(list);
    var found = false;
    var prev = null;
    var last = null;
    var maxti = 32768;
    var sti = source.tabIndex || maxti;
    var pti = 0;
    var lti = 0;
    list.reverse().some(function (elem) {
        if (elem.tabIndex == undefined
            || !Base.tabElements.includes(elem.tagName.toLowerCase())) {
            return (false);
        }
        if (elem == source) {
            found = true;
            return (false);
        }
        if (elem.tabIndex < 0) {
            return (false);
        }
        var eti = elem.tabIndex || maxti;
        if (eti == sti) {
            if (found) {
                prev = elem;
                return (true);
            }
        } else if (eti < sti) {
            if (eti > pti) {
                prev = elem;
                pti = eti;
            }
            return (false);
        }
        if (eti > lti) {
            last = elem;
            lti = eti;
        }
    });
    if (!prev) {
        prev = last;
    }
    if (prev) {
        prev.focus();
    }
};

var base;

init.push(function baseInit() {
        base = new Base();
        document.body.appendChild(base.n);
});
