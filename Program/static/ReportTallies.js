function ReportTallies()
{
    var o = this;
    DElement.call(o, 'div');
    o.menu = new Menu({ items: [
        { key: 'p', label: '(P)icked up by date', func: function () {
            base.switchTo(new ReportsPickedUpByDate());
        }},
        { key: 'n', label: '(N)ew by date', func: function () {
            base.switchTo(new ReportsNewByDate());
        }},
        { key: 's', label: '(S)ummary', func: function () {
            base.switchTo(new ReportsSummary());
        }},
        { key: 'c', label: 'by (C)lass', func: function () {
            base.switchTo(new ReportsByClass());
        }}
    ]});
    o.appendChild(o.menu);
}
extend(DElement, ReportTallies);

ReportTallies.prototype.activate = function () {
    var o = this;
    o.menu.activate();
    base.addNav([
        { key: 'Escape', msg: 'Cancel', func: function () { home(); } }
    ]);
};

ReportTallies.prototype.title = 'Tallies of members';
