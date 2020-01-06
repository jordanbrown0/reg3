var serverSchema = [
	[
		{ title: 'Server Configuration' },
		{ field: 'name', label: 'Server name', default: 'Unconfigured', required: true },
		{ field: 'noPrint', label: 'Disable printing?', input: InputBool, default: false },
		{ field: 'nextNumber', label: 'Next membership number to assign', input: InputInt,
			default: null, required: true },
		{ field: 'lastNumber', label: 'Last membership number to assign', input: InputInt,
			default: null, required: true },
	],
];
var serverDefault = undefined;
var serverID = undefined;

function ServerManager() {
    var o = this;
	params = {
		table: table.servers,
		schema: serverSchema,
		canDelete: true
	};
	ServerManager.sup.constructor.call(o, params);
	// When called from ServerManager, we don't need a custom ServerEdit.
	// It's needed when called from "configure this server", to supply
	// the key and appropriate parameters.
	ServerManager.prototype.Edit = ServerEdit;
}
extend(DBManager, ServerManager);

ServerManager.prototype.summarize = function (k, r) {
	return (new DElement('tr',
		new DElement('td', r.name, { id: 'name' }),
		new DElement('td', r.nextNumber, { id: 'nextNumber' }),
		new DElement('td', r.lastNumber, { id: 'lastNumber' })
	));
};

ServerManager.prototype.header = function () {
	return (new DElement('tr',
		new DElement('th', 'Name'),
		new DElement('th', 'Next'),
		new DElement('th', 'Last')
	));
};

function ServerEdit(k, params) {
	var o = this;
	ServerEdit.sup.constructor.call(o,
		k || server_id,
		params || { table: table.servers, schema: serverSchema }
	);
}

extend(DBEdit, ServerEdit);

ServerEdit.prototype.get = function (cb) {
	Server.get(cb);
};

var Server = {};

Server.newMembershipNumber = function (cb) {
	Server.id(function (id) {
		table.servers.inc(id, 'nextNumber', 'lastNumber', function (n) {
			cb(n);
		});
	});
};

Server.get = function(cb) {
	Server.id(function (id) {
		table.servers.getOrAdd(id, null, cb);
	});
};

// Retrieve and cache the server ID.
Server.id = function (cb) {
	if (serverID != undefined) {
		cb(serverID);
	} else {
		rpc.getServerID(function (id) {
			serverID = id;
			cb(serverID);
		});
	}
};

init.push(function () {
	table.servers = new DBTable(db.reg, 'servers',
		{ defaults: Editor.defaults(serverSchema) }
	);
});
