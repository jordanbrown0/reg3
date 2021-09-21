function label_test() {
    var s = 'TEST';
    var size;
    var p;

    Printers.getPrinter(cfg.label, gotPrinter, function () {});

    function gotPrinter(p_) {
        p = p_;
        // Check for printing disabled.
        if (!p) {
            home();
            return;
        }

        size = p.dpiy / 2;
        p.measure(cfg.font, size, s, gotDims);
    }
    function gotDims(dims) {
        var x = p.horzres/2 - dims.cx/2;
        var y = p.vertres/2 + dims.cy/2;
        var maxx = p.horzres - 1;
        var maxy = p.vertres - 1;
        var items = [
            { x: x, y: y, font: cfg.font, size:size, text: s },
            { x: 0, y: 0, lineto: { x: maxx, y: maxy }},
            { x: 0, y: maxy, lineto: { x: maxx, y: 0 }},
            { x: 0, y: 0, lineto: { x: maxx, y: 0 }},
            { x: maxx, y: 0, lineto: { x: maxx, y: maxy }},
            { x: maxx, y: maxy, lineto: { x: 0, y: maxy }},
            { x: 0, y: maxy, lineto: { x: 0, y: 0 }}
        ]
        p.print(items, home);
    }
}

function label_badge(r, done, err) {
    var items = [];
    var p;
    var allLimits;
    var nameLimits;
    var cityLimits;
    var numberLimits;
    var cl;
    var list;
    var t0 = Date.now();

    Class.get(r.class, gotClass);
    function gotClass(c) {
        if (!c) {
            alert('Unknown class');
            err();
            return;
        }
        if (!c.badgeOK) {
            // NEEDSWORK modal
            alert('Not eligible for badging - must upgrade first.');
            err();
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
        copies = cfg.badgeCopies;

        var right = [];
        if (cfg.badgeNumber.print) {
            right.push(drawNumber);
        }
        if (cl.onBadge) {
            right.push(drawClass);
        }

        allLimits = {
            x: 0,
            y: p.vertres,
            h: p.horzres,
            v: p.vertres
        };

        if (!cfg.badgeCity.print && right.length == 0) {
            nameLimits = {
                x: 0,
                h: p.horzres,
                v: p.vertres,
                y: p.vertres
            };
            list = [drawName];
        } else if (!cfg.badgeCity.print && right.length > 0) {
            // NEEDSWORK these should be measured rather than constants.
            numberLimits = {
                x: p.horzres * .91,
                h: p.horzres * .09,
                y: p.vertres,
                v: p.vertres
            };

            nameLimits = {
                x: 0,
                h: p.horzres * .9,
                v: p.vertres,
                y: p.vertres
            };
            list = right.concat(drawName);
        } else if (cfg.badgeCity.print && right.length == 0) {
            // NEEDSWORK these should be measured not constants.
            cityLimits = {
                x: 0,
                h: p.horzres,
                y: p.vertres,
                v: p.vertres * .09
            };

            nameLimits = {
                x: 0,
                h: p.horzres,
                v: p.vertres * .9,
                y: p.vertres * .9
            };
            list = [drawName, drawCity];
        } else { // cfg.badgeCity.print && cfg.badgeNumber
            numberLimits = {
                x: p.horzres * .91,
                h: p.horzres * .09,
                y: p.vertres,
                v: p.vertres
            };

            cityLimits = {
                x: 0,
                h: p.horzres * .90,
                y: p.vertres,
                v: p.vertres * .09
            };

            nameLimits = {
                x: 0,
                h: p.horzres * .90,
                v: p.vertres * .9,
                y: p.vertres * .9
            };
            list = right.concat(drawName, drawCity);
        }

        draw();

        function draw() {
            if (list.length > 0) {
                list.shift()();
            } else {
                var t1 = Date.now();
                log('time to lay out badge', t1 - t0);
                print();
            }
        }

        function print() {
            var t1 = Date.now();
            if (copies > 0) {
                copies--;
                p.print(items, print);
            } else {
                log('time to print badge', Date.now()-t1);
                drawPhone();
            }
        }
        function drawPhone() {
            if (cl.phoneLabel && r.phone) {
                items = [];
                shrink(allLimits, cfg.nameSizes, {
                    halign: 'center',
                    valign: 'center',
                    font: cfg.font,
                    text: r.phone
                }, printPhone);
            } else {
                done();
            }
        }
        function printPhone() {
            p.print(items, done);
        }
        function drawName() {
            var name1;
            var name2;
            if (r.badge1 || r.badge2) {
                name1 = r.badge1;
                name2 = r.badge2;
            } else {
                name1 = r.fname;
                name2 = r.lname;
            }

            if (name1 && name2) {
                drawTwoNames();
                return;
            } else if (name1 || name2) {
                drawOneName();
                return;
            }
            draw();

            function drawTwoNames() {
                var s = [name1, name2].join(' ');
                drawMaybe(nameLimits, {
                    halign: 'center',
                    valign: 'center',
                    font: cfg.font,
                    size: cfg.nameSizes[0],
                    text: s
                }, draw, drawTwoNamesLine1);
            }
            function drawTwoNamesLine1() {
                var limits = Object.assign({}, nameLimits);
                limits.y = limits.y - limits.v/2;
                limits.v = limits.v / 2;
                shrink(limits, cfg.nameSizes, {
                    halign: 'center',
                    valign: 'bottom',
                    font: cfg.font,
                    text: name1
                }, drawTwoNamesLine2)
            }
            function drawTwoNamesLine2(sizes) {
                var limits = Object.assign({}, nameLimits);
                limits.v = limits.v / 2;
                shrink(limits, sizes, {
                    halign: 'center',
                    valign: 'top',
                    font: cfg.font,
                    text: name2
                }, function (sizes) { draw(); })
            }
            function drawOneName(n) {
                shrink(nameLimits, cfg.nameSizes, {
                    halign: 'center',
                    valign: 'center',
                    font: cfg.font,
                    text: name1 || name2
                }, function (sizes) { draw(); })
            }
        }

        function drawCity() {
            var components = [];
            if (r.city) {
                components.push(r.city);
            }
            if (r.country && r.country != 'USA' && r.country != 'US') {
                components.push(r.country);
            } else if (r.state) {
                components.push(r.state);
            }
            items.push({
                x: cityLimits.x,
                y: cityLimits.y,
                font: cfg.font,
                size: cfg.badgeCity.size,
                text: components.join(', ')
            });
            draw();
        }
        function drawNumber() {
            if (r.number) {
                items.push({
                    x: numberLimits.x,
                    y: numberLimits.y,
                    font: cfg.font,
                    size: cfg.badgeNumber.size,
                    text: r.number
                });
            }
            draw();
        }
        function drawClass() {
            items.push({
                x: numberLimits.x,
                y: numberLimits.y * 0.9,
                font: cfg.font,
                size: cfg.numberSize,
                text: cl.onBadge
            });
            draw();
        }

    }
    function shrink(limits, sizes, item, cb) {
        if (sizes.length == 0) {
            alert('Too long:  '+item.text);
            log('Too long', item.text);
            cb(sizes);
            return;
        }
        item.size = sizes[0];
        drawMaybe(limits, item,
            function () { cb(sizes); },
            function () { shrink(limits, sizes.slice(1), item, cb); }
        );
    }

    function drawMaybe(limits, item, yes, no) {
        p.measure(item.font, item.size, item.text, drawMaybeGotDims);
        function drawMaybeGotDims(dims) {
            if (dims.cx > limits.h) {
                no();
            } else {
                items.push(adjust(item, limits, dims));
                yes();
            }
        }
    }

    function adjust(item, limits, dims) {
        var item2 = {
            font: item.font,
            size: item.size,
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
}

