function Home()
{
    var o = this;
    DElement.call(o, 'div');
    var items = [];
    
    items.push(
        // { title: title() },
        { key: 'p', label: '(P)reviously registered',
            func: function () { base.switchTo(new MemberManager()); }
        },
        { key: 'n', label: '(N)ew member', perms: 'newMember',
            func: function () { base.switchTo(new NewMember()); }
        }
    );
    if (lastKey) {
        var lf = joinTruthy([lastRec.last, lastRec.first], ', ');
        items.push({ key: 'f',
            label: '(F)ix last member (' + lf + ')',
            func: function () { base.switchTo(new MemberDisplay(lastKey)); }
        });
    }
    items.push(
        { key: 'r', label: '(R)eports', perms: 'reports',
            func: function () { base.switchTo(new ReportMenu()); }
        },
        { key: 'a', label: '(A)dministration', perms: 'admin',
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
        { key: '!', msg: null, func: function () { base.switchTo(new Admin()); } },
        { key: '?', msg: null, func: function () { base.switchTo(new DebugControl()); } }
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

