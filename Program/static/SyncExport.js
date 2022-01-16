function SyncExport()
{
    var o = this;
    SyncExport.sup.constructor.call(o, 'div');
}
extend(DElement, SyncExport);

SyncExport.prototype.activate = function () {
    var o = this;

    db.reg.listTables(function (tables) {
        o.bools = new InputSelectMulti({options: Object.keys(tables)});
        o.appendChild(o.bools);

        base.addCancel(home);
        base.addNav([
            { label: '&All', func: function () {
                Server.id(function (id) {
                    table.servers.update(id, {},
                        {setf: [ 'lastExport', {dateTime: []} ]},
                        function () {
                            db.reg.exportResync();
                            home();
                        }
                    );
                });
            } },
            { label: '&Selected', func: function () {
                db.reg.exportResync(o.bools.get());
                home();
            } }
        ]);
    });
};

SyncExport.prototype.title = 'Export...';
