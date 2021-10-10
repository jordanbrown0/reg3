var stationID = cookie('StationID');
var cfg;

window.onload = function () {
    sequence(finalInit, init);
    function finalInit() {
        // And finally... prime the configuration.
        Config.get(function () {
            log('Init done');
            base.activate();
            home();
        });
    }
};
