// This is not used at the moment; DBFstream.js is used.
// But it's a lot simpler than DBFstream, and it can do random
// access, so I don't want to just throw it away.

const fs = require('fs');
const { assert, mkdate } = require('./utils');
const Import = require('./Import');
const Charset = require('./Charset');

function DBF(name, params) {
    var o = this;
    o.fn = name;
    assert(params.map, 'No map');
    // dBASE field names are upper case in the database but are case
    // insensitive.  We allow our map to be case insensitive too by
    // uppercasing the names specified.
    o.map = [];
    params.map.forEach(function (ent) {
        var cnvfunc = Import.converters[ent.conversion];
        assert(cnvfunc, 'Bad conversion '+ent.conversion);
        o.map.push({
            from: ent.from.toUpperCase(),
            to: ent.to,
            convert: cnvfunc
        });
    });

    o.autoLower = params.autoLower;
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
    o.fields = {
        _deleted: { off: 0, name: '_deleted', type: 'd', length: 1, dec: 0 }
    };
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
        o.fields[rec.name] = rec;
    }
    if (recOff != o.recSize) {
        throw new Error('fields did not total to record size');
    }
};

DBF.prototype.read = async function(n) {
    var o = this;
    var buf = Buffer.alloc(o.recSize);
    var res = await o.fd.read(buf, 0, buf.length, o.hdrSize + n*o.recSize);
    return (o.convert(buf));
};

DBF.prototype.convert = function (buf) {
    var o = this;
    var ret = {};
    o.map.forEach(function (m) {
        var v = null;
        var f = o.fields[m.from];
        if (f) {
            v = Charset.decode(buf, 'win-1252', f.off, f.off+f.length).trimEnd();
            switch (f.type) {
            case 'N':
                v = Import.converters.number(v);
                break;
            case 'd':
                v = v ? true : undefined;
                break;
            case 'D':
                if (v) {
                    var year = parseInt(v.slice(0, 4));
                    var month = parseInt(v.slice(4, 6));
                    var day = parseInt(v.slice(6, 8));
                    v = mkdate(year, month, day);
                }
                break;
            case 'L':
                v = "TY".includes(v.toUpperCase());
                break;
            default:
                break;
            }
        }
        ret[m.to] = m.convert(v);
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
