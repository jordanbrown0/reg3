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

var logOnNewLine = true;

utils.log = function () {
    if (!logOnNewLine) {
        process.stdout.write('\n');
    }
    console.log.apply(console, arguments);
    logOnNewLine = true;
};

utils.status = function (s) {
    process.stdout.write('\r');
    process.stdout.write(s);
    logOnNewLine = false;
};

utils.streamWritePromise = async function (stream, buf) {
    return new Promise(function (resolve, reject) {
        stream.write(buf, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = exports = utils;