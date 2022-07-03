var categoriesSchema = [
    [
        { field: 'name', label: 'Category name', default: '', required: true },
        { field: 'description', label: 'Description', default: '', required: true },
    ],
];

function CategoryManager() {
    var o = this;
    params = {
        table: table.categories,
        schema: categoriesSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Categories',
        titleEdit: 'Edit category',
        titleAdd: 'New category',
        helpEdit: 'CategoryEdit'
    };
    CategoryManager.sup.constructor.call(o, params);
}
extend(DBManager, CategoryManager);

CategoryManager.prototype.summarize = function (k, r) {
    return (tr(
        td(r.name, { id: 'name' }),
        td(r.description, { id: 'description' })
    ));
};

var Categories = {};

Categories.list = function (cb) {
    table.categories.list({filter: true }, cb);
};

init.push(function categoriesInit() {
    table.categories = new DBTable(db.reg, 'categories',
        { schema: categoriesSchema }
    );
});
