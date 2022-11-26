function Report()
{
    var o = this;
    Report.sup.constructor.call(o, 'div', {tabIndex: 0});
}
extend(DElement, Report);

Report.prototype.activate = function () {
    var o = this;

    base.addNav([
        { label: '&Print', order: 10, func: function () { window.print(); } },
        { label: 'Done', key: 'Enter', order: 1, func: home },
        { key: 'Escape', func: home }
    ]);

    o.focus();

    rpc.eval(null, {dateTime: []}, function (d) {
        o.time = LDate.fromJSON(d);

        var tbody = new DElement('tbody');
        tbody.appendChild('Working...');

        var t = o.appendChild(new DElement('table'));
        t.addClass(getClassName(o));
        t.addClass('Report');

        var h = new DElement('thead');
        h.appendChild(tr(td(cfg.convention, {id: 'header', colSpan: 100})));
        if (o.header) {
            h.appendChild(o.header());
        }
        t.appendChild(h);

        t.appendChild(tbody);

        var f = new DElement('tfoot');
        if (o.footer) {
            f.appendChild(o.footer());
        }
        f.appendChild(tr(td(o.time.toDisplay(), {id: 'footer', colSpan: 100})));
        t.appendChild(f);

        o.body(function (body) {
            tbody.replaceChildren(body);
        });
    });
};

Report.prototype.title = 'Reports';

Report.prototype.noArrows = true;
