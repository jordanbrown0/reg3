function Base()
{
    var o = this;
    DElement.call(o, 'div', { className: 'Base' });
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
        o.active = n;
        o.body.replaceChildren(n);
        o.setNav([]);
        o.title.replaceChildren(n.title instanceof Function ? n.title() : n.title);
        // Caution:  n.activate may be asynchronous, and it has no done callback.
        // Perhaps it should.
        n.activate();
    });
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

var base;

init.push(function baseInit() {
        base = new Base();
        document.body.appendChild(base.n);
});
