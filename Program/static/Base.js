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
	o.navBar = new NavBar();
	o.navKey = new NavKey();
	o.appendChild(o.header, o.body, o.navBar);
}
extend(DElement, Base);

Base.prototype.activate = function () {
	var o = this;
	o.tick();
    // NEEDSWORK fast tick for testing purposes.
	setInterval(function () { o.tick(); }, 1*1000);
	Global.get(function (cfg) {
		pageTitle.set(cfg.convention);
	});
};

Base.prototype.switchTo = function (n) {
	var o = this;
	o.body.replaceChildren(n);
	o.setNav([]);
	o.title.replaceChildren(n.title instanceof Function ? n.title() : n.title);
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
	rpc.eval(null, {dateTime: []}, function (d8601) {
		o.clock.replaceChildren(displayDateTime(d8601, true));
	});
};

var base;

init.push(function baseInit() {
		base = new Base();
		document.body.appendChild(base.n);
		init.push(function () {
			base.activate();
		});
});
