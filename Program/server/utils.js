var utils = {};

utils.assert = function (bool, param) {
    if (!bool) {
        throw (new Error('assertion failure: ' + param));
    }
}

utils.mkdate = function (year, month, day, hours, minutes, seconds) {
    var ret = year.toString().padStart(4, '0')
        + '-'
        + month.toString().padStart(2, '0')
        + '-'
        + day.toString().padStart(2, '0');

    if (hours != undefined) {
        hours = hours || 0;
        minutes = minutes || 0;
        seconds = seconds || 0;
        ret += 'T'
            + hours.toString().padStart(2, '0')
            + ':'
            + minutes.toString().padStart(2, '0')
            + ':'
            + seconds.toString().padStart(2, '0')
    }
    return (ret);
}

module.exports = exports = utils;