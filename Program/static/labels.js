function label_badge(r, done, err) {
    var p;
    var cl;
    var t0 = Date.now();
    var right;              // measured dims of right sidebar
    var bottom;             // measures dims of bottom bar
    var smallItems = [];    // right and bottom items
    var nameLimits = {};
    var DEFAULT_WEIGHT = 'default';

    Class.get(r.class, gotClass);
    function gotClass(c) {
        if (!c) {
            modal('Unknown class \"'+r.class+'\".', { ok: err });
            return;
        }
        if (!c.badgeOK) {
            modal('Class \"' + r.class
                + '\" not eligible for badging - must upgrade first.',
                { ok: err }
            );
            return;
        }
        cl = c;
        Printers.getPrinter(cfg.label, gotPrinter, err);
    }

    function gotPrinter(p_) {
        p = p_;
        // Check for printing disabled.
        if (!p) {
            done();
            return;
        }

        var todo = [];
        var printSeq = [];

        right = {
            x: p.limits.x + p.limits.h - 1,
            y: p.limits.y,
            width: 0
        };
        bottom = {
            x: p.limits.x,
            y: p.limits.y,
            v: 0
        };

        var phoneLimits = {
            x: p.limits.x,
            y: p.limits.y,
            h: p.limits.h,
            v: p.limits.v
        };
        var badgeNameItems = [];
        var realNameItems = [];
        var phoneItems = [];

        if (cfg.badgeNumber.print && r.number) {
            todo.push([ addRight, r.number.toString() ]);
        }
        if (cl.onBadge) {
            todo.push([ addRight, cl.onBadge ]);
        }
        if (cfg.badgeCity.print) {
            todo.push(doBottom);
        }

        var bname = joinTruthy([r.badge1, r.badge2], ' ');
        var rname = joinTruthy([r.fname, r.lname], ' ');
        var doBadgeNameLabel = (r.badge1 || r.badge2) && (rname != bname);
        var doRealNameLabel = cfg.realNameLabel || !doBadgeNameLabel;

        todo.push(calcNameLimits);

        if (doBadgeNameLabel) {
            todo.push([ drawName,
                badgeNameItems, nameLimits, r.badge1, r.badge2, false ]);
            printSeq.push([ print, smallItems, badgeNameItems ]);
        }
        if (doRealNameLabel) {
            if (r.organization) {
                todo.push([ drawName,
                    realNameItems, nameLimits, rname, r.organization, true ]);
            } else {
                todo.push([ drawName,
                    realNameItems, nameLimits, r.fname, r.lname, false ]);
            }
            printSeq.push([ print, smallItems, realNameItems ]);
        }

        if (cl.phoneLabel && r.phone) {
            todo.push([ drawName,
                phoneItems, phoneLimits, r.phone, undefined, false]);
            printSeq.push([ print, phoneItems ]);
        }

        for (var i = 0; i < cfg.badgeCopies; i++) {
            printSeq.forEach(function (e) { todo.push(e); });
        }

        todo.push(timestamp);

        sequence(done, todo);
    }

    function addRight(cb, text) {
        var weight = DEFAULT_WEIGHT;
        p.measure(cfg.font, cfg.badgeNumber.size, weight, text,
            function (dims) {
                var item = {
                    x: right.x,
                    y: right.y,
                    size: cfg.badgeNumber.size,
                    weight: weight,
                    halign: 'right',
                    valign: 'bottom',
                    text: text
                };
                smallItems.push(item);
                right.width = Math.max(right.width, dims.cx);
                right.y -= dims.cy;
                cb();
            }
        );
        return (true);
    }

    function doBottom(cb, items) {
        var weight = DEFAULT_WEIGHT;
        var components = [];
        if (r.city) {
            components.push(r.city);
        }
        if (r.country && r.country != 'USA' && r.country != 'US') {
            components.push(r.country);
        } else if (r.state) {
            components.push(r.state);
        }
        var text = components.join(', ');
        p.measure(cfg.font, cfg.badgeCity.size, weight, text,
            function (dims) {
                var item = {
                    halign: 'left',
                    valign: 'bottom',
                    x: bottom.x,
                    y: bottom.y,
                    size: cfg.badgeCity.size,
                    weight: weight,
                    text: text
                };
                smallItems.push(item);
                bottom.y -= dims.cy;
                bottom.v += dims.cy;
                cb();
            }
        );
        return (true);
    }

    function calcNameLimits(cb) {
        nameLimits.x = p.limits.x;
        nameLimits.y = bottom.y;
        nameLimits.h = p.limits.h - right.width;
        nameLimits.v = p.limits.v - bottom.v;
    }

    function drawName(cb, items, limits, name1, name2, force2) {
        if (name1 && name2) {
            drawTwoNames(name1, name2);
            return true;
        } else if (name1 || name2) {
            drawOneName(name1 || name2);
            return true;
        }
        // No name?  How sad.  But at least it's synchronous.
        return undefined;

        function drawTwoNames() {
            function drawTwoNamesOneLine() {
                var s = [name1, name2].join(' ');
                drawMaybe(items, nameLimits, {
                    halign: 'center',
                    valign: 'center',
                    size: cfg.nameSizes[0],
                    weight: cfg.weight,
                    text: s
                }, cb, drawTwoNamesLine1);
            }

            function drawTwoNamesLine1() {
                var limits1 = Object.assign({}, limits);
                limits1.y = limits.y - limits.v/2;
                limits1.v = limits.v / 2;
                shrink(items, limits1, cfg.nameSizes, {
                    halign: 'center',
                    valign: 'bottom',
                    weight: cfg.weight,
                    text: name1
                }, drawTwoNamesLine2);
            }
            function drawTwoNamesLine2(sizes) {
                var limits2 = Object.assign({}, limits);
                limits2.v = limits.v / 2;
                shrink(items, limits2, sizes, {
                    halign: 'center',
                    valign: 'top',
                    weight: cfg.weight,
                    text: name2
                }, function (sizes) { cb(); })
            }
            if (force2) {
                drawTwoNamesLine1();
            } else {
                drawTwoNamesOneLine();
            }
        }

        function drawOneName(n) {
            shrink(items, limits, cfg.nameSizes, {
                halign: 'center',
                valign: 'center',
                weight: cfg.weight,
                text: n
            }, function (sizes) { cb(); })
        }
    }

    function shrink(items, limits, sizes, item, cb) {
        if (sizes.length == 0) {
            modal('Too long:  '+item.text, { ok: err });
            return;
        }
        item.size = sizes[0];
        drawMaybe(items, limits, item,
            function () { cb(sizes); },
            function () { shrink(items, limits, sizes.slice(1), item, cb); }
        );
    }

    function drawMaybe(items, limits, item, yes, no) {
        p.measure(cfg.font, item.size, item.weight, item.text,
            drawMaybeGotDims);
        function drawMaybeGotDims(dims) {
            if (dims.cx > limits.h || dims.cy > limits.v) {
                no();
            } else {
                items.push(adjust(item, limits, dims));
                yes();
            }
        }
    }

    function adjust(item, limits, dims) {
        // Eventually it would be nice to use server-side alignment,
        // but we don't have server-side vertical center.
        var item2 = {
            halign: 'left',
            valign: 'bottom',
            size: item.size,
            weight: item.weight,
            text: item.text,
        };
        switch (item.halign) {
        case 'right':
            item2.x = limits.x + limits.h - dims.cx;
            break;
        case 'center':
            item2.x = limits.x + (limits.h - dims.cx)/2;
            break;
        case 'left':
        default:
            item2.x = limits.x;
            break;
        }
        switch (item.valign) {
        case 'top':
            item2.y = limits.y - limits.v + dims.cy;
            break;
        case 'center':
            item2.y = limits.y - (limits.v - dims.cy)/2;
            break;
        case 'left':
        default:
            item2.y = limits.y;
            break;
        }
        return (item2);
    }

    function print(cb /* ... */) {
        var allItems = [ {font: cfg.font} ];
        for (var i = 1; i < arguments.length; i++) {
            var item = arguments[i];
            if (item instanceof Array) {
                item.forEach(function (e) {
                    allItems.push(e);
                });
            } else {
                allItems.push(item);
            }
        }
        p.print(allItems, cb);
        return true;
    }
    
    function timestamp() {
        log('Time to layout and print ', Date.now()-t0, 'ms');
    }
}
