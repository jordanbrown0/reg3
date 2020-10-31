function Home()
{
    var o = this;
    Home.sup.constructor.call(o, 'div');
    var items = [];
    items.push(
        // { title: title() },
        { label: '&Previously registered',
            func: function () { base.switchTo(new MemberManager()); }
        },
        { label: '&New member', perms: 'newMember',
            func: function () { base.switchTo(new NewMember()); }
        }
    );
    if (lastKey) {
        var lf = joinTruthy([lastRec.last, lastRec.first], ', ');
        items.push({
            label: '&Fix last member',
            label2: ' (' + lf + ')',
            func: function () { base.switchTo(new MemberDisplay(lastKey)); }
        });
    }
    items.push(
        { label: '&Reports', perms: 'reports',
            func: function () { base.switchTo(new ReportMenu()); }
        },
        { label: '&Administration', perms: 'admin',
            func: function () { base.switchTo(new Admin()); }
        }
    );

    o.menu = new Menu({ items: items });
    o.appendChild(o.menu);
}
extend(DElement, Home);

Home.prototype.activate = function () {
    var o = this;
    base.addNav([
        { key: '!', func: function () { base.switchTo(new Admin()); } },
        { key: '?', func: function () { base.switchTo(new DebugControl()); } }
    ]);
    o.menu.activate();
    pageTitle.set(cfg.convention);
    Home.sup.activate.call();
};

Home.prototype.deactivate = function (cb) {
    var o = this;
    getAllConfig(function (cfg_) {
        cfg = cfg_;
        pageTitle.set(cfg.convention);
        Home.sup.deactivate.call(o, cb);
    });
};

Home.prototype.title = function () {
    var o = this;
    return (cfg.convention);
};

function home()
{
    base.switchTo(new Home());
}

