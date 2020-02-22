function Import()
{
    var o = this;
    Import.sup.constructor.call(o, 'div');

    var fileInput = new DElement('input', {
        type: 'file',
        onchange: function () {
            log('fileInput change');
            log(fileInput.n.files);
            REST.upload('/REST/importDB/reg', fileInput.n.files.item(0),
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
        { key: 'Escape', msg: 'Cancel', func: function () { home(); } }
    ]);
};

Import.prototype.title = 'Import';
