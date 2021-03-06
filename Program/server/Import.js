const { mkdate } = require('./utils.js');

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
    var result = v.match('^([0-9]+)/([0-9]+)/([0-9]+) ([0-9]+):([0-9]+):([0-9]+)$');
    if (!result) {
        return (undefined);
    }

    var [ , month, day, year, hour, minute, second ] = result;

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

module.exports = exports = Import;
