import { assert, log } from './utils.js';

var debug = {
    rpc: {
        value: 0,
        max: 2,
        messages: [ 'No RPC tracing', 'RPC names only', 'Full RPC tracing' ]
    },
    busy: {
        value: true,
        messages: {
            false: 'Not showing busy percentage / memory usage',
            true: 'Showing busy percentage / memory usage'
        }
    },
    db: {
        value: false,
        messages: {
            false: 'Not tracing database operations',
            true: 'Tracing database operations'
        }
    },
    expr: {
        value: false,
        messages: {
            false: 'Not tracing expressions',
            true: 'Tracing expressions'
        }
    },
    version: {
        value: false,
        messages: {
            false: 'Not tracing version updates',
            true: 'Tracing version updates'
        }
    }
};

var Debug = {};

function dbg(active, argv) {
    if (active && argv.length > 0) {
        log.apply(null, argv);
    }
    return (active);
}

for (let k in debug) {
    function addDebug(flag) {
        switch (typeof (debug[flag].value)) {
        case 'number':
            Debug[flag] = function (level) {
                // Optimize the (usual) false case.
                if (debug[flag].value < level) {
                    return (false);
                }
                let argv = Array.prototype.slice.call(arguments, 1);
                return (dbg(true, argv));
            };
            Debug[flag].toggle = function () {
                debug[flag].value =
                    (debug[flag].value + 1) % (debug[flag].max + 1);
                return (debug[flag].messages[debug[flag].value]);
            }
            break;
        case 'boolean':
            Debug[flag] = function () {
                return (dbg(debug[flag].value, arguments));
            };
            Debug[flag].toggle = function () {
                debug[flag].value = !debug[flag].value;
                return (debug[flag].messages[debug[flag].value]);
            }
            break;
        default:
            throw new Error(flag+' bad debug type '+typeof(debug[flag].value));
        }
    }
    addDebug(k);
}

Debug._set = function (settings) {
    for (let n in settings) {
        assert(n in debug, 'unknown debug setting '+n);
        debug[n].value = settings[n];
    }
};

Debug._get = function () {
    let ret = {};
    for (let n in debug) {
        ret[n] = debug[n].value;
    }
    return (ret);
};

Debug._info = function () {
    return (debug);
};

export { Debug };