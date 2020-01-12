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
	setInterval(function () { o.tick(); }, 60*1000);
};

Base.prototype.switchTo = function (n) {
	var o = this;
	o.body.removeChildren();
	o.body.appendChild(n);
	o.setNav([]);
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
	rpc.eval(null, {date: []}, function (d) {
		o.clock.removeChildren();
		o.clock.appendChild(displayDateTime(new Date(d), false));
	});
	Global.get(function (cfg) {
		o.title.removeChildren();
		o.title.appendChild(cfg.convention + ' Registration');
		pageTitle.set(cfg.convention);
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
