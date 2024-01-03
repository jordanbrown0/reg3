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
            { label: 'Zap', page: Zap },
            { label: 'Download client installer',
                func: function () {
                    download('/install/InstallClient.exe');
                }
            }
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
            { label: '&Import', page: SyncImport },
            { label: '&Export', page: SyncExport }
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
            { label: '&Manage', page: PrinterManager },
            { label: '&Test  assigned printer', func: Printers.testCurrent },
            { label: '&Identify printers', page: PrinterIdentify }
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
            { label: 'Ser&ver configuration', page: ServerEdit },
            { label: 'Station manager', page: StationManager },
            { label: 'Server manager', page: ServerManager },
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
            { label: '&Metaclasses', page: MetaclassManager },
            { label: '&Upgrades', page: UpgradeManager },
            { label: 'Categories', page: CategoryManager },
            { label: 'Corrections', page: CorrectionManager },
            { label: '&Fields', page: FieldManager },
            { label: 'E&xternal import/export', page: External },
            // Note:  Renumber does not have a one-key shortcut, for safety.
            { label: 'Renumber', page: Renumber },
            { label: 'Bulk operations', page: BulkManager },
            { label: 'Bulk runner', page: BulkRunner },
        ]
    });
}
extend(MenuPage, AdminMember);

AdminMember.prototype.title = 'Membership Administration';
