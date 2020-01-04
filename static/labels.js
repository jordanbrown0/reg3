function label_test(done) {
	var cfg;
	var s = 'TEST';
	var size;
	var caps;
	var printer;

	getPrinterInfo(gotInfo);
	
	function gotInfo(res) {
		cfg = res.cfg;
		printer = res.printer;
		caps = res.caps;
		size = caps.dpiy / 2;
		rpc.label_measureText(printer, cfg.font, size, s, gotDims);
	}
	function gotDims(dims) {
		var x = caps.horzres/2 - dims.cx/2;
		var y = caps.vertres/2 + dims.cy/2;
		rpc.label_print(printer, [
			{ x: x, y: y, font: cfg.font, size:size, text: s }
		], done);
	}
}

function label_badge(r, done, err) {
	var items = [];
	var cfg;
	var caps;
	var allLimits;
	var nameLimits;
	var cityLimits;
	var numberLimits;
	var printer;
	var cl;
	var list;
	var t0 = Date.now();

	alert('printing disabled');
	done();
	return;
	
	getClass(r.class, gotClass,
		function () {
			// NEEDSWORK modal
			alert('Unknown class');
			err();
		}
	);
	function gotClass(c) {
		if (!c.badgeOK) {
			// NEEDSWORK modal
			alert('Not eligible for badging - must upgrade first.');
			err();
			return;
		}
		cl = c;
		getPrinterInfo(gotInfo, err);
	}
	
	function gotInfo(res) {
		caps = res.caps;
		cfg = res.cfg;
		printer = res.printer;
		copies = cfg.badgeCopies;
	
		var right = [];
		if (cfg.badgeNumber) {
			right.push(drawNumber);
		}
		if (cl.onBadge) {
			right.push(drawClass);
		}

		allLimits = {
			x: 0,
			y: caps.vertres,
			h: caps.horzres,
			v: caps.vertres
		};
		
		if (!cfg.badgeCity && right.length == 0) {
			nameLimits = {
				x: 0,
				h: caps.horzres,
				v: caps.vertres,
				y: caps.vertres
			};
			list = [drawName];
		} else if (!cfg.badgeCity && right.length > 0) {
			// NEEDSWORK these should be measured rather than constants.
			numberLimits = {
				x: caps.horzres * .91,
				h: caps.horzres * .09,
				y: caps.vertres,
				v: caps.vertres
			};
			
			nameLimits = {
				x: 0,
				h: caps.horzres * .9,
				v: caps.vertres,
				y: caps.vertres
			};
			list = right.concat(drawName);
		} else if (cfg.badgeCity && right.length == 0) {
			// NEEDSWORK these should be measured not constants.
			cityLimits = {
				x: 0,
				h: caps.horzres,
				y: caps.vertres,
				v: caps.vertres * .09
			};
			
			nameLimits = {
				x: 0,
				h: caps.horzres,
				v: caps.vertres * .9,
				y: caps.vertres * .9
			};
			list = [drawName, drawCity];
		} else { // cfg.badgeCity && cfg.badgeNumber
			numberLimits = {
				x: caps.horzres * .91,
				h: caps.horzres * .09,
				y: caps.vertres,
				v: caps.vertres
			};

			cityLimits = {
				x: 0,
				h: caps.horzres * .90,
				y: caps.vertres,
				v: caps.vertres * .09
			};
			
			nameLimits = {
				x: 0,
				h: caps.horzres * .90,
				v: caps.vertres * .9,
				y: caps.vertres * .9
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
				rpc.label_print(printer, items, print);
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
			rpc.label_print(printer, items, done);
		}
		function drawName() {
			var name1;
			var name2;
			if (r.badge1 || r.badge2) {
				name1 = r.badge1;
				name2 = r.badge2;
			} else {
				name1 = r.first;
				name2 = r.last;
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
				size: cfg.citySize,
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
					size: cfg.numberSize,
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
		rpc.label_measureText(printer, item.font, item.size, item.text,
			drawMaybeGotDims);
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

function getPrinterInfo(cb, abort) {
	var cfg;
	var printer;
	
	getAllConfig(gotConfig);
	
	function gotConfig(res) {
		if (res.noPrint) {
			alert('Would print label now');
			abort();
			return;
		}
		cfg = res;
		if (!cfg.label) {
			alert('No printer configured!');
			abort();
			return;
		}
		getPrinter(cfg.label, gotPrinter);
	}
	function gotPrinter(p) {
		printer = p.windows;
		rpc.printers(gotPrinters);
	}

	// It seems surprising and unfortunate that this is the only
	// way to retrieve this information.  I bet there's a "get status
	// of printer by name" function that I haven't found yet.
	function gotPrinters(plist) {
		var p;
		while (p = plist.pop()) {
			if (p.printerName == printer) {
				if (p.attributes.WORK_OFFLINE) {
					alert('Label printer is offline');
					abort();
					return;
				}
				rpc.label_getDeviceCaps(printer, gotCaps);
				return;
			}
		}
		throw new Error('Selected printer is in list, but not in enumeration');
	}
	
	function gotCaps(res) {
		cb({cfg: cfg, printer: printer, caps: res});
	}
}