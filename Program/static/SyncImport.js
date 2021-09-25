function SyncImport()
{
    var o = this;
    SyncImport.sup.constructor.call(o, 'div');

    var fileInput = new DElement('input', {
        type: 'file',
        onchange: function () {
            db.reg.importResync(fileInput.n.files.item(0),
                function (conflicts) {
                    base.switchTo(new ConflictListResolver(conflicts, {
                        done: function () {
                            modal("Import done", { ok: home });
                        }
                    }));
                }
            );
        }
    });
    o.appendChild(fileInput);
    fileInput.n.click();
}
extend(DElement, SyncImport);

SyncImport.prototype.activate = function () {
    base.addCancel(home);
};

SyncImport.prototype.title = 'Import';
