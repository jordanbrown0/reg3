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
    // NEEDSWORK Also write to a file.
    logOnNewLine = true;
}

function status(s) {
    process.stdout.write('\r');
    process.stdout.write(s);
    logOnNewLine = false;
}

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
}

function unreachable() {
    throw new Error('Reached point expected to be unreachable');
}

function UserError(msg) {
    var o = this;
    o.message = msg;
    o.stack = (new Error()).stack;
}

UserError.prototype.toString = function () {
    var o = this;
    return (o.message);
};

function streamWrapper(f) {
    return (function () {
        var stream = this;
        try {
            f.apply(stream, arguments);
        } catch (e) {
            stream.emit('error', e);
        }
    });
}

// Return a cached value, or create it and cache it.
// c is a cache, initialized to {}.
// f is a function that will create the desired object.
// The additional arguments are keys that identify the particular object.
function cache(c, f /* ... */) {
    for (var i = 2; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!(arg in c)) {
            if (i < arguments.length - 1) {
                c[arg] = {};
            } else {
                c[arg] = f();
            }
        }
        c = c[arg];
    }
    return (c);
}

export {
    assert,
    cache,
    mkdate,
    log,
    status,
    streamWrapper,
    streamWritePromise,
    unreachable,
    UserError
};
