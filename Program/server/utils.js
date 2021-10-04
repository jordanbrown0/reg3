function assert(bool, param) {
    if (!bool) {
        throw (new Error('assertion failure: ' + param));
    }
}

function mkdate(year, month, day, hours, minutes, seconds) {
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

function log() {
    if (!logOnNewLine) {
        process.stdout.write('\n');
    }
    console.log.apply(console, arguments);
    logOnNewLine = true;
};

function status(s) {
    process.stdout.write('\r');
    process.stdout.write(s);
    logOnNewLine = false;
};

async function streamWritePromise(stream, buf) {
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

export { assert, mkdate, log, status, streamWritePromise };