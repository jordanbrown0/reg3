function Report()
{
    var o = this;
    Report.sup.constructor.call(o, 'div', {tabIndex: 0});
}
extend(DElement, Report);

Report.prototype.activate = function () {
    var o = this;

    base.addNav([
        { key: 'P', msg: 'Print', func: function () { window.print(); } },
        { key: 'Enter', msg: 'Done', func: home },
        { key: 'Escape', func: home }
    ]);
    
    o.focus();
    
    var tbody = new DElement('tbody');
    tbody.appendChild('Working...');

    var t = o.appendChild(new DElement('table'));
    if (o.header) {
        t.appendChild(new DElement('thead', o.header()));
    }
    t.appendChild(tbody);
    if (o.footer) {
        t.appendChild(new DElement('tfoot', o.footer()));
    }
    o.body(function (body) {
        tbody.replaceChildren(body);
    });
};

Report.prototype.title = 'Reports';