// Initialize the database.  This needs to come after RPC initialization and
// before the various tables get initialized.
var db = {};

init.push(function (cb) {
	db.reg = new DB('reg', { onload: cb });
	return (true);
});

var table = {};