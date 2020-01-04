function NavBar()
{
    var o = this;
	NavBar.sup.constructor.call(o, 'div', {className: 'NavBar'});
}
extend(DElement, NavBar);

NavBar.prototype.set = function (a) {
	var o = this;
	o.removeChildren();
	o.add(a);
};

NavBar.prototype.add = function (a) {
	var o = this;
	a.forEach(function (e) {
		if (e.msg) {
			o.appendChild(new Button(e.msg, {
				onclick: function () {
					if (isRPCActive()) {
						log('button ignored because RPC active');
					} else {
						e.func();
					}
				}
			}));
		}
	});
};
