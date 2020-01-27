// Version vectors
//
// A version vector is an object with a list of version numbers.
// It is *not* a classed object, because the natural way to acquire one is
// by reading it from a DB, and there it would be a generic object.
// Classing it would be extra work that would be low-value, in processing
// that's at least somewhat performance-sensitive.

var Version = {};

// Compare two version vectors
// Return:
// 0 - equal
// 1 - first is greater
// 2 - second is greater
// 3 - conflict
Version.compare = function (vv1, vv2) {
    var state = 0;
    for (var i in vv1) {
        var v1 = vv1[i];
        var v2 = vv2[i] || 0;
        if (v1 > v2) {
            state |= 1;
        } else if (v2 > v1) {
            state |= 2;
        }
    }
    for (var i in vv2) {
        if (!vv1[i]) {
            state |= 2;
        }
    }
    return (state);
};

Version.bump = function (vv, id) {
    if (vv[id]) {
        vv[id]++;
    } else {
        vv[id] = 1;
    }
};

Version.merge = function (vv1, vv2) {
    var res = {};
    for (var i in vv1) {
        res[i] = vv1[i];
    }
    for (var i in vv2) {
        if (!vv1[i] || vv2[i] > vv1[i] ) {
            res[i] = vv2[i];
        }
    }
    return (res);
};

module.exports = exports = Version;
