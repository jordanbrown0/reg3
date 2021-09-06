function ReportMenu()
{
    var o = this;
    ReportMenu.sup.constructor.call(o, {
        items: [
            { label: '&Tallies of members', page: ReportTallies },
            { label: '&List', page: ReportList },
            { label: '&Duplicates', page: ReportDupsSetup },
            { label: '&Classes', page: ReportClasses },
            { label: '&Upgrades', page: ReportUpgrades }
        ]
    });
}
extend(MenuPage, ReportMenu);

ReportMenu.prototype.title = 'Reports';
