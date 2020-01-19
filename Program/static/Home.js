function Home()
{
	// function title() {
		// var content = new DElement('span');
		// getAllConfig(function (cfg) {
			// content.appendChild(cfg.convention + ' Registration');
		// });
		// return (content);
	// }
	var o = this;
    DElement.call(o, 'div');
	o.menu = new Menu({ items: [
		// { title: title() },
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

Home.prototype.title = function () {
	var o = this;
	var span = new DElement('span');
	Global.get(function (cfg) {
		span.replaceChildren(cfg.convention);
	});
	return span;
};

function home()
{
	base.switchTo(new Home());
}

