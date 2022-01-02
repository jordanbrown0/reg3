// Initialize the database.  This needs to come after RPC initialization and
// before the various tables get initialized.

init.push(function dbInit (cb) {
    db.reg = new DB('reg', { onload: cb });
    return (true);
});
