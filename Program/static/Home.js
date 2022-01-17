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
                modal('Really quit?', {
                    cancel: function () {
                        // On cancel (don't quit), just dismiss the modal.
                    },
                    ok: function () {
                        // Don't try to stop closing the window.
                        unloadOK = true;
                        window.close();
                        // FF won't let you close a window that the user opened,
                        // only ones opened via a script.  (Which includes ones
                        // opened via the FF command line.)  If we survived the
                        // close attempt, tell the user.  While that modal is
                        // up, it's still OK to close the window.  But if the
                        // user dismisses the modal, return to normal operation.
                        // Note:  the rule is actually more complex than that;
                        // manually opened windows seem to be closable if you
                        // haven't done much with them.
                        modal('You will have to close this window manually.', {
                            ok: function () {
                                unloadOK = false;
                            }
                        });
                    },
                });
            }
        }
    ]);
    Config.refresh(function () {
        o.menu.activate();
        pageTitle.set(cfg.convention);
        Home.sup.activate.call(o);
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

init.push(function homeInit() {
    home();
});
