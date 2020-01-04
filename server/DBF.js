const fs = require('fs');

function DBF(name, map) {
	var o = this;
	o.fn = name;
	o.map = map || {};
}

DBF.prototype.load = async function () {
	var o = this;
	
	o.fd = await fs.promises.open(o.fn, 'r');
	var buf = Buffer.alloc(10);
	var res = await o.fd.read(buf, 0, buf.length, 0);
	version = buf.readUInt8(0);
	if (version != 0x03 && version != 0x30) {
		throw new Error('Not a supported DBF file');
	}
	var hdrSize = buf.readUInt16LE(8);
	buf = Buffer.alloc(hdrSize);
	res = await o.fd.read(buf, 0, buf.length, 0);
	
	o.version = version;
	o.hdrSize = hdrSize;
	o.lastmod = new Date(buf.readUInt8(1)+2000, buf.readUInt8(2), buf.readUInt8(3));
	o.nRec = buf.readUInt32LE(4);
	o.recSize = buf.readUInt16LE(10);
	o.fields = [
		{ off: 0, name: '_deleted', type: 'd', length: 1, dec: 0 }
	];
	var recOff = 1;
	for (var off = 32; buf.readUInt8(off) != 0x0d; off += 32) {
		rec = {
			off: recOff,
			name: buf.toString('ascii', off, buf.indexOf(0, off)),
			type: buf.toString('ascii', off+11, off+12),
			length: buf.readUInt8(off+16),
			dec: buf.readUInt8(off+17)
		}
		recOff += rec.length;
		switch(o.map[rec.name]) {
		case undefined:
			break;
		case null:
			continue;
		default:
			rec.name = o.map[rec.name];
			break;
		}
		o.fields.push(rec);
	}
	if (recOff != o.recSize) {
		throw new Error('fields did not total to record size');
	}
};

DBF.prototype.read = async function(n) {
	var o = this;
	var buf = Buffer.alloc(o.recSize);
	var res = await o.fd.read(buf, 0, buf.length, o.hdrSize + n*o.recSize);
	var ret = {};
	o.fields.forEach(function (f) {
		var s = buf.toString('ascii', f.off, f.off+f.length).trimEnd()
		switch (f.type) {
		case 'N':
			ret[f.name] = parseFloat(s);
			break;
		case 'd':
			if (s) {
				rec[f.name] = true;
			}
			break;
		default:
			ret[f.name] = s;
			break;
		}
	});
	return (ret);
};

DBF.prototype.all = async function (cb) {
	var o = this;
	for (var i = 0; i < o.nRec; i++) {
		cb(await o.read(i));
	}
};

DBF.prototype.close = async function () {
	var o = this;
	if (o.fd) {
		await o.fd.close();
	}
	delete o.fd;
};

module.exports = exports = DBF;
