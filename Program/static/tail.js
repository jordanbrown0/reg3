var stationID = cookie('StationID');

// NEEDSWORK arguably base.activate should be done before home() is called
// by Home.js's init function.  But:  base.activate can't be called before
// RPC is ready.

window.onload = function () {
    sequence(finalInit, init);
    function finalInit() {
        log('Init done');
        base.activate();
    }
};
