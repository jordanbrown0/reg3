function ReportTallies()
{
    var o = this;
    ReportTallies.sup.constructor.call(o, 'div');
    o.menu = new Menu({ items: [
        { label: '&Picked up by date', func: function () {
            base.switchTo(new ReportTallyPickedUpByDate());
        }},
        { label: '&New by date', func: function () {
            base.switchTo(new ReportTallyNewByDate());
        }},
        { label: '&Summary', func: function () {
            base.switchTo(new ReportSummary());
        }},
        { label: 'by &Class', func: function () {
            base.switchTo(new ReportTallyByClass());
        }}
    ]});
    o.appendChild(o.menu);
}
extend(DElement, ReportTallies);

ReportTallies.prototype.activate = function () {
    var o = this;
    o.menu.activate();
    base.addNav([
        { label: 'Cancel', key: 'Escape', func: function () { home(); } }
    ]);
};

ReportTallies.prototype.title = 'Tallies of members';
