const { mkdate, assert, log } = require('./utils.js');
const DBMS = require('./DBMS');
const DBF = require('./DBFstream');
const CSV = require('./CSV');

var Import = {};

Import.converters = {};

Import.converters.null = function (v) {
    if (v === null || v === undefined || v === '') {
        return (undefined);
    }
    return (v);
};
Import.converters.undefined = Import.converters.null;
Import.converters[''] = Import.converters.null;

// NEEDSWORK duplicated in DBFstream.js
Import.converters.number = function (v) {
    v = parseFloat(v.replace(/[^-0-9.]/g,''));
    if (isNaN(v)) {
        v = undefined;
    }
    return (v);
};

// Convert a v2 date-time string to v3 (ISO 8601) format.
Import.converters.datev2 = function (v) {
    if (!v) {
        return (undefined);
    }
    var result = v.match(
        '^([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+):([0-9]+):([0-9]+)$');
    if (!result) {
        return (undefined);
    }

    var [ , month, day, year, hour, minute, second ] = result;

    return (mkdate(year, month, day, hour, minute, second));
};

// Convert mm/dd/yy or mm/dd/yyyy string to v3 (ISO 8601) format.
Import.converters.mmddyyyy = function (v) {
    if (!v) {
        return (undefined);
    }
    var result = v.match('^ *([0-9]+) */ *([0-9]+) */ *([0-9]+)');
    if (!result) {
        return (undefined);
    }

    var [ , month, day, year ] = result;
    if (year < 100) {
        year += 2000;
    }

    return (mkdate(year, month, day));
};

// Convert dd/mm/yy or dd/mm/yyyy string to v3 (ISO 8601) format.
Import.converters.ddmmyyyy = function (v) {
    if (!v) {
        return (undefined);
    }
    var result = v.match('^ *([0-9]+) */ *([0-9]+) */ *([0-9]+)');
    if (!result) {
        return (undefined);
    }

    var [ , day, month, year ] = result;
    if (year < 100) {
        year += 2000;
    }

    return (mkdate(year, month, day));
};

// Convert a Member Solutions m/d/y h:m{am|pm}
// date-time string to v3 (ISO 8601) format.
Import.converters.dateMS = function (v) {
    if (!v) {
        return (undefined);
    }
    var result = v.match('^([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+):([0-9]+)([AaPp][Mm])$');
    if (!result) {
        return (undefined);
    }

    var [ , month, day, year, hour, minute, ampm ] = result;
    hour = parseInt(hour);
    if (ampm.toLowerCase() == 'pm') {
        if (hour != 12) {
            hour += 12;
        }
    } else {
        if (hour == 12) {
            hour = 0;
        }
    }
    hour = hour.toString();

    return (mkdate(year, month, day, hour, minute));
};

Import.formats = {};
Import.formats.CSV = CSV;
Import.formats.DBF = DBF;
Import.formats.CSVh = {
    import: async function (path, params, cb) {
        params.headers = true;
        await CSV.import(path, params, cb);
    }
};

Import.import = async function (file, t, params) {
    let t0 = Date.now();
    let n = 0;
    let map = [];
    params.map.forEach(function (ent) {
        let cnvfunc = Import.converters[ent.conversion];
        assert(cnvfunc, 'Bad conversion '+ent.conversion);
        map.push({
            from: ent.from.toLowerCase(),
            to: ent.to,
            convert: cnvfunc
        });
    });

    var format = Import.formats[params.type];
    assert(format, 'Bad format '+params.type);
    var importer = format.import;
    assert(importer, 'No importer for '+params.type);
    t.sync(false);
    await importer(file.path, params, function (importRecord) {
        if (importRecord._deleted) {
            // NEEDSWORK:  dBASE deleted records have data preserved.
            // Our deleted records do not; they are only a tombstone.
            // Adding a deleted record with data would be a violation of the
            // definition.
            // Adding a tombstone would be pointless because this is a new
            // record, from our DBMS's point of view.
            // We'll just ignore dBASE deleted records for now.
            // Is that the best answer? Issue #179.
            return;
        }
        delete importRecord._deleted;

        var r = {};
        map.forEach(function (m) {
            r[m.to] = m.convert(importRecord[m.from]);
        });
        for (fieldName in params.contentMap) {
            let v = params.contentMap[fieldName][r[fieldName]];
            if (v) {
                r[fieldName] = v;
            }
        };

        t.add(null, r, null);
        n++;
    });
    t.sync(true);
    log('imported',n,'records from', file.originalname,
        'took', Date.now()-t0, 'ms');
};

module.exports = exports = Import;
