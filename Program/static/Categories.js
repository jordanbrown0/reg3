var categoriesSchema = [
    [
        { field: 'name', label: 'Category name', default: '', required: true },
        { field: 'description', label: 'Description', default: '', required: true },
    ],
];

function CategoriesManager() {
    var o = this;
    params = {
        table: table.categories,
        schema: categoriesSchema,
        canAdd: true,
        canDelete: true,
        titleManager: 'Categories',
        titleEdit: 'Edit category',
        titleAdd: 'New category'
    };
    CategoriesManager.sup.constructor.call(o, params);
}
extend(DBManager, CategoriesManager);

CategoriesManager.prototype.summarize = function (k, r) {
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
