function Import()
{
    var o = this;
    Import.sup.constructor.call(o, 'div');

    var fileInput = new DElement('input', {
        type: 'file',
        onchange: function () {
            db.reg.import(fileInput.n.files.item(0),
                function (conflicts) {
                    base.switchTo(new ConflictListResolver(conflicts));
                }
            );
        }
    });
    o.appendChild(fileInput);
    fileInput.n.click();
}
extend(DElement, Import);

Import.prototype.activate = function () {
    base.addNav([
        { label: 'Cancel', key: 'Escape', func: function () { home(); } }
    ]);
};

Import.prototype.title = 'Import';
