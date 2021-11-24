function Home()
{
    var o = this;
    Home.sup.constructor.call(o, 'div');
    var items = [];
    items.push(
        // { title: title() },
        { label: '&Previously registered', page: MemberManager },
        { label: '&New member', perms: 'newMember', page: NewMember }
    );
    if (lastKey) {
        var lastRecName = Member.name(lastRec);
        items.push({
            label: '&Fix last member',
            label2: ' (' + lastRecName + ')',
            func: function () { base.switchTo(new MemberDisplay(lastKey)); }
        });
    }
    items.push(
        { label: '&Reports', perms: 'reports', page: ReportMenu },
        { label: '&Administration', perms: 'admin', page: Admin }
    );

    o.menu = new Menu({ items: items });
    o.appendChild(o.menu);
}
extend(DElement, Home);

Home.prototype.activate = function () {
    var o = this;
    base.addNav([
        { key: '!', page: Admin },
        { key: '?', page: DebugControl },
        { label: 'Quit', key: 'Escape', order: 0,
            func: function () {
                window.close();
                // FF won't let you close a window that the user opened,
                // only ones opened via a script.  (Which includes ones
                // opened via the FF command line.)
                modal('You will have to close this window manually.');
            }
        }
    ]);
    Config.refresh(function () {
        o.menu.activate();
        pageTitle.set(cfg.convention);
        Home.sup.activate.call();
    });
};

Home.prototype.deactivate = function (cb) {
    var o = this;
    Config.refresh(function () {
        pageTitle.set(cfg.convention);
        Home.sup.deactivate.call(o, cb);
    });
};

Home.prototype.title = function () {
    var o = this;
    var t = new DElement('div', cfg.convention);
    if (!cfg.offlinePrint || !cfg.offlineMarkPickedUp || !cfg.offlineRealTime) {
        t.appendChild(new DElement('div', {className: 'AlertSubtitle'},
            'This station is configured for offline operation!'));
    }

    return (t);
};

function home()
{
    document.body.style.fontSize = cfg.screenFontSize.toString() + 'pt';
    base.switchTo(new Home());
}
