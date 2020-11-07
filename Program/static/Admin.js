function Admin()
{
    var o = this;
    Admin.sup.constructor.call(o, {
        items: [
            { label: '&Classes', page: ClassManager },
            { label: '&Global configuration', page: GlobalEdit },
            { label: '&Printer management', page:  PrinterManager },
            { label: '&Station configuration', page: StationEdit },
            { label: '&Q station manager', page: StationManager },
            { label: '&Upgrades', page: UpgradesManager },
            { label: 'Categories', page: CategoriesManager },
            { label: 'Corrections', page: CorrectionsManager },
            { label: 'E&xternal import/export', page: External },
            { label: 'ser&ver manager', page: ServerManager },
            { label: '&Test printer', func: label_test },
            { label: '&Import', page: Import },
            { label: '&Export', page: Export },
            // Note:  Renumber does not have a one-key shortcut, for safety.
            { label: 'Renumber', page: Renumber },
            // Note:  Zap does not have a one-key shortcut, for safety.
            { label: 'Zap', page: Zap }
        ]
    });
}
extend(MenuPage, Admin);

Admin.prototype.title = 'Administration';
