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
        var lf = joinTruthy([lastLast, lastFirst], ', ');
        items.push({ key: 'f',
            label: '(F)ix last member (' + lf + ')',
            func: function () { base.switchTo(new MemberDisplay(lastKey)); }
        });
    }
    items.push(
        { key: 'r', label: '(R)eports', perms: 'reports',
            func: function () { base.switchTo(new Reports()); }
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
        { key: '!', msg: null, func: function () { base.switchTo(new Admin()); } }
    ]);
    o.menu.activate();
};

Home.prototype.deactivate = function (cb) {
    getAllConfig(function (cfg_) {
        cfg = cfg_;
        cb();
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

