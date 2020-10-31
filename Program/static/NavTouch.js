// OK, so this is totally pointless.  But it's amusing.
// Currently only two events are supported:  swipeLeft and swipeRight.
// In a Nav object, they're selected by touch: <type>.
function NavTouch()
{
    var o = this;
    document.documentElement.ontouchstart = function (e) {
        o.start = e;
    };
    document.documentElement.ontouchend = function (e) {
        if (o.start.touches.length != 1
            || e.changedTouches.length != 1) {
            return;
        }
        var t1 = o.start.touches.item(0);
        var t2 = e.changedTouches.item(0);
        if (t1.identifier != t2.identifier) {
            return;
        }
        var dx = t2.screenX - t1.screenX;
        var dy = t2.screenY - t1.screenY;
        if (Math.abs(dx) < 200) {
            return;
        }
        if (Math.abs(dy) > 200) {
            return;
        }
        var evtype = dx > 0 ? 'swipeRight' : 'swipeLeft';
        if (o.handlers[evtype]) {
            o.handlers[evtype]();
        }
    };
}

NavTouch.prototype.clear = function () {
    var o = this;
    o.handlers = {};
};

NavTouch.prototype.add = function (e) {
    var o = this;
    if (e.touch) {
        o.handlers[e.touch] = e.func;
    }
};
