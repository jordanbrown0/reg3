function Index(t, fields) {
    var o = this;
    o.t = t;
    o.fields = fields;
    o.comparator = t.comparator(fields);
    o.keys = t.sort(o.fields);
}

Index.prototype.equals = function (fields) {
    var o = this;
    if (o.fields.length != fields.length) {
        return (false);
    }
    for (var i = 0; i < fields.length; i++) {
        if (fields[i] != o.fields[i]) {
            return (false);
        }
    }
    return (true);
};

Index.prototype.every = function (cb, thisArg) {
    var o = this;
    return (o.keys.every(cb, thisArg));
};

Index.prototype.add = function (k, r) {
    var o = this;
    o.keys = o.t.sort(o.fields);
};

Index.prototype.put = function (k, oldr, newr) {
    var o = this;
    o.keys = o.t.sort(o.fields);
};

export { Index };
