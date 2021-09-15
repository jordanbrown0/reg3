const fs = require('fs');
const { assert, mkdate } = require('./utils');
const Import = require('./Import');

function DBFstream(name, params) {
    var o = this;
    o.fileName = name;
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

DBFstream.prototype.convert = function (buf) {
    var o = this;
    var ret = {};
    o.map.forEach(function (m) {
        var v = null;
        var f = o.fields[m.from];
        if (f) {
            v = buf.toString('ascii', f.off, f.off+f.length).trimEnd();
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

DBFstream.prototype.all = async function(cb) {
    var o = this;
    o.stream = fs.createReadStream(o.fileName);

    const PREHEADER = 0;
    const HEADER = 1;
    const RECORD = 2;

    var state = PREHEADER;
    var need = 10;
    var have = 0;
    var chunks = [];
    
    o.stream.on('data', function (chunk) {
        chunks.push(chunk);
        have += chunk.length;
        while (have >= need) {
            var buf = chunks.length == 1 ? chunks[0] : Buffer.concat(chunks);
            chunks = [ buf.slice(need) ];
            buf = buf.slice(0,need);
            have -= buf.length;

            switch (state) {
            case PREHEADER:
                o.version = buf.readUInt8(0);
                if (o.version != 0x03 && o.version != 0x30) {
                    throw new Error('Not a supported DBF file');
                }
                o.hdrSize = buf.readUInt16LE(8);
                
                // Unread the preheader, then read the rest of the header.
                have += buf.length;
                need = o.hdrSize;
                chunks.unshift(buf);
                state = HEADER;
                break;
                
            case HEADER:
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
                need = o.recSize;
                state = RECORD;
                break;

            case RECORD:
                cb(o.convert(buf));
                break;
            }
        }
    });

    return (new Promise(function (resolve, reject) {
        o.stream.on('end', function () {
            // Note:  we ignore a final line that does not end in a newline.
            // This avoids having to distinguish a data line that does not
            // end in a newline (which would generate a record) from an empty
            // line which does not end in a newline.
            resolve();
        });
    }));
};

DBFstream.prototype.close = function () {
    var o = this;
    if (o.stream) {
        o.stream.close();
        delete o.stream;
    }
};

module.exports = exports = DBFstream;