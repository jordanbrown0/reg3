function External()
{
    var o = this;
    External.sup.constructor.call(o, {
        items: [
            { label: 'Import mapping', page: ExternalImportManager },
            { label: '&Import', page: ExternalImport },
            { label: 'Export mapping', page: ExternalExportManager },
            { label: '&Export', page: ExternalExport }
        ]
    });
}
extend(MenuPage, External);

External.prototype.title = 'External import/export';
