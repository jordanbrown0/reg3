// var utils = {};

global.assert = function (bool, param) {
	if (!bool) {
		throw (new Error('assertion failure: ' + param));
	}
}

// module.exports = exports = utils;