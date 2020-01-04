var station_id = cookie('StationID');

window.onload = function () {
	function doInit() {
		var f;
		while (f = init.shift()) {
			if (f(doInit)) {
				return;
			}
		}
		log('Init done');
	}
	doInit();
};
