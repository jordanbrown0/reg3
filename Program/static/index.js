log('Hello from JavaScript');

function Base()
{
	var o = this;
	DElement.call(o, 'div', { className: 'Base' });
	o.body = new DElement('div', { className: 'Body' });
	o.appendChild(o.body);
	o.navBar = new NavBar();
	o.navKey = new NavKey();
	o.appendChild(o.navBar);
}
extend(DElement, Base);

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

function Home()
{
	function title() {
		var content = new DElement('span');
		getAllConfig(function (cfg) {
			content.appendChild(cfg.convention + ' Registration');
		});
		return (content);
	}
	var o = this;
    DElement.call(o, 'div');
	o.menu = new Menu({ items: [
		{ title: title() },
		{ key: 'p', label: '(P)reviously registered', func: function () { base.switchTo(new MemberManager()); }},
		{ key: 'n', label: '(N)ew member', func: function () { base.switchTo(new NewMember()); }},
		{ key: 'a', label: '(A)dministration', func: function () { base.switchTo(new Admin()); }},
		{ key: 'r', label: '(R)eports', func: function () { base.switchTo(new Reports()); }}
	]});
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

// What's the division of labor between this and Modal?
// Who is responsible for keyboard handling?
function modal(contents) {
	var m = new Modal(contents, { ok: function () {base.removeChild(m);}});
	base.appendChild(m);
}

function home()
{
	base.switchTo(new Home());
}

var base;

init.push(function() {
		base = new Base();
        document.body.appendChild(base.n);
		home();
});
