var cfg;
var Config = {};

// NEEDSWORK This should perhaps be a flag on the table, rather
// than a list here.  (But then how would priority order be maintained?
// *Should* priority order be maintained?)
Config.sources = new ArrayObject([
    { global: Global.get },
    { servers: Server.get },
    { stations: Station.get },
    { corrections: CorrectionsManager.get },
    { fields: FieldsManager.get }
]);

Config.check = function (cb) {
    Debug.config('config:  checking');
    if (!cfg || !cfg._versions || !cfg._last) {
        Debug.config('config:  forced');
        cb(true);
        return;
    }
    if (cfg._last + cfg.ttl*1000 > Date.now()) {
        Debug.config('config:  not time yet');
        cb(false);
        return;
    }
    Config.getVersions(function (r) {
        var changed = Config.sources.some(function (tName, getFunc) {
            if (r._versions[tName] != cfg._versions[tName]) {
                Debug.config('config:  '+tName+' updated');
                cb(true);
                return (true);
            }
        });
        if (!changed) {
            Debug.config('config:  no change');
            cfg._last = Date.now();
            cb(false);
        }
    });
};

Config.refresh = function (cb) {
    Config.check(function (needed) {
        if (!needed) {
            cb();
            return;
        }
        Config.get(cb);
    });
};

Config.getVersions = function (cb) {
    db.reg.listTables(function (tables) {
        var ret = {};
        for (var i in tables) {
            ret[i] = tables[i].version;
        }
        cb({_versions: ret});
    });
};

// Retrieve global and per-station configuration and merge them.
// Store the result in the global cfg.
Config.get = function(cb) {
    var res = {};
    var iter = Config.sources.iter();

    function got(r) {
        Object.assign(res, r);
        var ko = iter.next();
        if (ko) {
            ko.obj(got);
        } else {
            res._last = Date.now();
            Debug.config('config:', res);
            cfg = res;
            cb();
        }
    }

    Config.getVersions(got);
};

init.push(function configInit(cb) {
    Config.get(cb);
    return (true);
});
