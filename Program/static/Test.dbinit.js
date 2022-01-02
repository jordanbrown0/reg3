// Initialize the database.  This needs to come after RPC initialization and
// before the various tables get initialized.

init.push(function dbInit (cb) {
    db.test = new DB('test', { onload: cb });
    return (true);
});
