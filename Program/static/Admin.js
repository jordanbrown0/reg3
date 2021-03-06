function Admin()
{
    var o = this;
    Admin.sup.constructor.call(o, {
        items: [
            { label: '&Member', page: AdminMember },
            { label: '&Configuration', page: AdminConfig },
            { label: '&Printing', page:  AdminPrinting },
            { label: '&Synchronize', page: AdminSync },
            // Note:  Zap does not have a one-key shortcut, for safety.
            { label: 'Zap', page: Zap }
        ]
    });
}
extend(MenuPage, Admin);

Admin.prototype.title = 'Administration';

function AdminSync()
{
    var o = this;
    AdminSync.sup.constructor.call(o, {
        items: [
            { label: '&Import', page: Import },
            { label: '&Export', page: Export }
        ]
    });
}
extend(MenuPage, AdminSync);

AdminSync.prototype.title = 'Synchronize';

function AdminPrinting()
{
    var o = this;
    AdminPrinting.sup.constructor.call(o, {
        items: [
            { label: '&Manage', page:  PrinterManager },
            { label: '&Test printer', func: label_test }
        ]
    });
}
extend(MenuPage, AdminPrinting);

AdminPrinting.prototype.title = 'Printing';

function AdminConfig()
{
    var o = this;
    AdminConfig.sup.constructor.call(o, {
        items: [
            { label: '&Global configuration', page: GlobalEdit },
            { label: '&Station configuration', page: StationEdit },
            { label: '&Q station manager', page: StationManager },
            { label: 'ser&ver manager', page: ServerManager },
        ]
    });
}
extend(MenuPage, AdminConfig);

AdminConfig.prototype.title = 'Configuration';

function AdminMember()
{
    var o = this;
    AdminMember.sup.constructor.call(o, {
        items: [
            { label: '&Classes', page: ClassManager },
            { label: '&Upgrades', page: UpgradesManager },
            { label: 'Categories', page: CategoriesManager },
            { label: 'Corrections', page: CorrectionsManager },
            { label: 'E&xternal import/export', page: External },
            // Note:  Renumber does not have a one-key shortcut, for safety.
            { label: 'Renumber', page: Renumber },
        ]
    });
}
extend(MenuPage, AdminMember);

AdminMember.prototype.title = 'Membership Administration';
