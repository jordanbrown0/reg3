var metaclassesSchema = [
    [
        { field: 'name', label: 'Name',
            default: '', required: true },
        { field: 'description', label: 'Description',
            default: '', required: true },
    ],
];

function MetaclassManager() {
    var o = this;
    params = {
        table: table.metaclasses,
        schema: metaclassesSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Metaclasses',
        titleEdit: 'Edit metaclass',
        titleAdd: 'New metaclass',
        helpEdit: 'MetaclassEdit'
    };
    MetaclassManager.sup.constructor.call(o, params);
}
extend(DBManager, MetaclassManager);

MetaclassManager.prototype.summarize = function (k, r) {
    return (tr(
        td(r.description, { id: 'description' })
    ));
};

init.push(function MetaclassesInit() {
    table.metaclasses = new DBTable(db.reg, 'metaclasses',
        { schema: metaclassesSchema }
    );
});
