var debug = {
    rpc: false,
    keyboard: false,
    dom: false,
    config: false
};

var Debug = {};

for (var k in debug) {
    function addDebug(flag) {
        Debug[flag] = function () {
            if (debug[flag]) {
                log.apply(null, arguments);
            }
        };
    }
    addDebug(k);
}