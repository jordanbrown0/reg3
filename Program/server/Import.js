import { mkdate, assert, log, UserError } from './utils.js';
import { DBMS } from './DBMS.js';
import { DBF } from './DBFstream.js';
import { CSV } from './CSV.js';

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
    if (!v) {
        return (undefined);
    }
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
        '^([0-9]+)/([0-9]+)/([0-9]+)( ([0-9]+):([0-9]+):([0-9]+))?$');
    if (!result) {
        return (undefined);
    }

    var [ , month, day, year, junk, hour, minute, second ] = result;

    year = parseInt(year);
    if (year < 100) {
        year += 2000;
    }

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

// Convert a yyyy-mm-dd hh:mm:ss date with optional "UTC" qualifier
// Sample from Chicon 2022:  2020-07-30 21:44:02 UTC
// Note that the *only* time zone supported is UTC.
Import.converters.yyyymmdd = function (v) {
    if (!v) {
        return (undefined);
    }
    var result = v.match(
        '^ *([0-9]+) *[-/] *([0-9]+) *[-/] *([0-9]+)'
        + '(  *([0-9]+) *: *([0-9]+) *: *([0-9]+))? *(UTC)? *$'
    );
    if (!result) {
        return (undefined);
    }

    var [ , year, month, day, junk, hour, minute, second, utc ] = result;

    year = parseInt(year);
    if (year < 100) {
        year += 2000;
    }
    month = parseInt(month);
    day = parseInt(day);
    hour = hour ? parseInt(hour) : 0;
    minute = minute ? parseInt(minute) : 0;
    second = second ? parseInt(second) : 0;

    if (utc) {
        // Convert from UTC to local time.
        var d = new Date(Date.UTC(year, month-1, day, hour, minute, second));
        year = d.getFullYear();
        month = d.getMonth()+1;
        day = d.getDate();
        hour = d.getHours();
        minute = d.getMinutes();
        second = d.getSeconds();
    }
    return (mkdate(year, month, day, hour, minute, second));
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

Import.converters.phone = function (v) {
    if (!v) {
        return (undefined);
    }
    let result;

    result = v.match(
        '^ *(`?\\+?1)?[( ]*([2-9][0-9][0-9])[-/). ]*([2-9][0-9][0-9])[-. ]*([0-9][0-9][0-9][0-9]) *$');
    if (result) {
        var [ , , p1, p2, p3 ] = result;
        v = '+1 (' + p1 + ')' + p2 + '-' + p3;
    }

    return (v);
};

Import.formats = {};
Import.formats.CSV = CSV;
Import.formats.DBF = DBF;
Import.formats.CSVh = {
    import: async function (path, params, cb) {
        params = Object.assign({}, params, { headers: true });
        await CSV.import(path, params, cb);
    }
};

Import.import = async function (file, t, params) {
    let t0 = Date.now();
    let ret = {
        kept: 0,
        replaced: 0,
        added: 0,
    };
    let map = [];
    var keyField = params.key ? params.key.toLowerCase() : null;
    var keys = {};

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
    try {
        t.sync(false);
        switch (params.existing) {
        case 'keep':
        case 'replace':
            if (!keyField) {
                throw new UserError('"Keep" and "Replace" modes require a key'
                    + ' field in the import map.');
            }
            break;
        case 'zap':
            t.zap();
            break;
        case 'add':
            break;
        }
        await importer(file.path, params, function (importRecord) {
            if (importRecord._deleted) {
                // Note:  dBASE deleted records have data preserved.
                // Our deleted records do not; they are only a tombstone.
                // Adding a deleted record with data would be a violation of the
                // definition.
                // Adding a tombstone would be pointless because this is a new
                // record, from our DBMS's point of view.
                // We just ignore dBASE deleted records.
                return;
            }
            delete importRecord._deleted;

            var r = {};
            map.forEach(function (m) {
                r[m.to] = m.convert(importRecord[m.from]);
            });
            for (var fieldName in params.contentMap) {
                let v = params.contentMap[fieldName][r[fieldName]];
                if (v) {
                    r[fieldName] = v;
                }
            };

            var k = keyField ? importRecord[keyField] : null;
            if (k) {
                k = k.toString();
                if (keys[k]) {
                    throw new UserError('Duplicate key "'+k+'" in imported data');
                }
                keys[k] = true;
                var rOld = t.getOrNull(k);
                if (rOld) {
                    switch (params.existing) {
                    case 'replace':
                        // Existing record, delete and replace it.
                        t.delete(k, null);
                        // Remember that we are using a fixed key, so this will
                        // revive the deleted record.
                        t.add(k, r, null);
                        ret.replaced++;
                        break;
                    case 'keep':
                        // Existing record, keep it and discard the import.
                        ret.kept++;
                        break;
                    case 'zap':
                        // Should not be possible, means duplicate key in import,
                        // which we checked for above.
                        unreachable();
                    case 'add':
                        t.add(null, r, null);
                        ret.added++;
                        break;
                    default:
                        unreachable();
                    }
                } else {
                    // We have a key, but no existing record; add it.
                    t.add(k, r, null);
                    ret.added++;
                }
            } else {
                // No key, just add.
                t.add(null, r, null);
                ret.added++;
            }
        });
    } finally {
        t.sync(true);
    }
    log('imported',ret.added+ret.replaced,'records from', file.originalname,
        'took', Date.now()-t0, 'ms');
    return (ret);
};

export { Import };
