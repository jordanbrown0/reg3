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
        var lf = joinTruthy([lastRec.lname, lastRec.fname], ', ');
        items.push({
            label: '&Fix last member',
            label2: ' (' + lf + ')',
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
        { key: '?', page: DebugControl }
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
    return (cfg.convention);
};

function home()
{
    base.switchTo(new Home());
}
