var stationID = cookie('StationID');
var cfg;

window.onload = function () {
    function doInit() {
        var f;
        while (f = init.shift()) {
            if (f(doInit)) {
                return;
            }
        }
        // And finally... prime the configuration.
        Config.get(function () {
            log('Init done');
            base.activate();
            home();
        });
    }
    doInit();
};
