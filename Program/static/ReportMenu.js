function ReportMenu()
{
    var o = this;
    ReportMenu.sup.constructor.call(o, {
        items: [
            { label: '&Tallies of members', page: ReportTallies },
            { label: '&List', page: ReportListSetup },
            { label: '&Duplicates', page: ReportDupsSetup },
            { label: '&Classes', page: ReportClasses },
            { label: '&Upgrades', page: ReportUpgrades },
            { label: 'Configuration', page: ReportConfigMenu }
        ]
    });
}
extend(MenuPage, ReportMenu);

ReportMenu.prototype.title = 'Reports';

function ReportConfigMenu()
{
    var o = this;
    ReportTallies.sup.constructor.call(o, {
        items: [
            { label: '&Global', page: ReportConfigGlobal }
        ]
    });
}
extend(MenuPage, ReportConfigMenu);

ReportConfigMenu.prototype.title = 'Configuration reports';
