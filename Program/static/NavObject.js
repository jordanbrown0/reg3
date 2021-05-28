// This set of functions gets attached as a prototype to
// caller-supplied nav objects.

function NavObject() {
}

NavObject.prototype.disable = function () {
    var o = this;
    if (o.button) {
        o.button.disable();
    }
    o.disabled = true;
};

NavObject.prototype.enable = function () {
    var o = this;
    if (o.button) {
        o.button.enable();
    }
    o.disabled = false;
};
