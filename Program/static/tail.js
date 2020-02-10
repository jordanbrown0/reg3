var stationId = cookie('StationID');
var cfg;

window.onload = function () {
    function doInit() {
        var f;
        while (f = init.shift()) {
            log(f);
            if (f(doInit)) {
                return;
            }
        }
        // And finally... prime the configuration.
        getAllConfig(function (cfg_) {
            cfg = cfg_;
            log('Init done');
            base.activate();
            home();
        });
    }
    doInit();
};
