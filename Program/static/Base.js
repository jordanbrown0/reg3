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
    o.clock = new DElement('div');
    o.numberLeft = new DElement('div');
    o.rightTitle = new DElement('span', { id: 'headerClock' }, o.clock, o.numberLeft);
    o.help = new DElement('span', {id: 'headerHelp'},
        new Button('?', {onclick: function () { help(HELP_POP); }}));
    o.title = new DElement('span', { id: 'headerTitle'});
    o.header = new DElement('div', { className: 'Header' },
        o.title,
        o.rightTitle,
        o.help
    );
    o.body = new DElement('div', { className: 'Body' });
    o.active = new DElement('div');
    o.navBar = new NavBar();
    o.navKey = new NavKey();
    o.navTouch = new NavTouch();
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
    o.setNav([]);
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
        }
    ]);
    if (!n.noArrows) {
            o.addNav([
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
    }
    o.title.replaceChildren(n.title instanceof Function ? n.title() : n.title);
    working(false);
    if(cfg.help) {
        help(HELP_UPDATE);
    }
    // Caution:  n.activate may be asynchronous, and it has no done callback.
    // Perhaps it should.
    n.activate();
};

Base.prototype.addNav = function (a) {
    var o = this;
    a.forEach(function (e) {
        if (!o.processNav(e)) {
            return;
        }
        o.navBar.add(e);
        o.navKey.add(e);
        o.navTouch.add(e);
    });
};

Base.prototype.setNav = function (a) {
    var o = this;
    o.navBar.clear();
    o.navKey.clear();
    o.navTouch.clear();
    o.addNav(a);
};

Base.prototype.addCancel = function (f) {
    var o = this;
    o.addNav([{ label: 'Cancel', key: 'Escape', order: 0, func: f }]);
};

Base.prototype.tick = function () {
    var o = this;
    rpc.eval(null, {dateTime: []}, function (d) {
        o.clock.replaceChildren(LDate.fromJSON(d).toDisplay({seconds: false}));
        Server.getMembershipNumbers(function (mn) {
            var s;
            if (mn.lastNumber == null || mn.nextNumber == null) {
                s = 'Member numbers not configured';
            } else if (mn.nextNumber > mn.lastNumber) {
                s = 'No member numbers left';
            } else {
                s = (mn.lastNumber - mn.nextNumber + 1) + ' member numbers left';
            }
            o.numberLeft.replaceChildren(s);
        });
    });
};

// NEEDSWORK perhaps this should move to NavObject.js.
Base.prototype.processNav = function (item) {
    var o = this;
    if (item.perms && !cfg.permissions.includes(item.perms)) {
        return (false);
    }

    // NEEDSWORK MDN cautions against use of setPrototypeOf for
    // performance reasons.  Maybe that's not really a factor for
    // us.  It would be a nuisance to have to convey a new object
    // back out to callers.
    Object.setPrototypeOf(item, NavObject.prototype);

    if (item.page) {
        item.func = function () { o.switchTo(new item.page()); }
    }
    var label = item.label;
    var key = item.key;
    if (typeof(label) == 'string') {
        item.label = new DElement('span');
        for (var i = 0; i < label.length; i++) {
            var c = label.charAt(i);
            if (c == '&' && i+1 < label.length) {
                i++;
                c = label.charAt(i);
                if (c != '&') {
                    item.label.appendChild(new DElement('u', c));
                    item.key = c;
                    continue;
                }
            }
            item.label.appendChild(c);
        }
        if (item.label2) {
            item.label.appendChild(item.label2);
        }
        if (key) {
            item.label.appendChild(' (');
            item.label.appendChild(new DElement('u', key));
            item.label.appendChild(')');
        }
    }
    return (true);
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

var helpWindow;
var HELP_POP = 0;
var HELP_UPDATE = 1;

function help(pop) {
    if (base.active) {
        var page = base.active.help || getClassName(base.active);
        var url = 'doc/'+page+'.html';
        if (pop == HELP_POP || !helpWindow || helpWindow.closed) {
            helpWindow = window.open(url, 'help',
                'top=50,left=50,width=800,height=500');
        } else {
            helpWindow.location = url;
        }
    }
}

var base;

init.push(function baseInit() {
        base = new Base();
        document.body.appendChild(base.n);
});
