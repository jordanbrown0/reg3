const fs = require('fs');
const Charset = require('./Charset');
const { assert, mkdate } = require('./utils');

function DBFField(off, name, type, length, dec) {
    var o = this;
    o.off = off;
    o.name = name.toLowerCase();
    o.type = type;
    o.length = length;
    o.dec = dec;
    o.convert = DBFConverters[o.type] || DBFConverters.def;
}

DBFField.fromBuffer = function (off, buf) {
    let name = buf.toString('ascii', 0, buf.indexOf(0)).toLowerCase();
    let type = buf.toString('ascii', 11, 12);
    let length = buf.readUInt8(16);
    let dec = buf.readUInt8(17);
    return (new DBFField(off, name, type, length, dec));
};

DBFField.prototype.get = function (buf) {
    var o = this;
    return (o.convert(Charset.decode(buf, 'win-1252', o.off, o.off+o.length).trimEnd()));
};

var DBFConverters = {};

DBFConverters.def = function (v) {
    return (v ? v : undefined);
};

DBFConverters.N = function (v) {
    // NEEDSWORK duplicated in Import.js
    v = parseFloat(v.replace(/[^-0-9.]/g,''));
    if (isNaN(v)) {
        return (undefined);
    }
    return (v);
};

DBFConverters.D = function (v) {
    if (v) {
        var year = parseInt(v.slice(0, 4));
        var month = parseInt(v.slice(4, 6));
        var day = parseInt(v.slice(6, 8));
        return (mkdate(year, month, day));
    }
    return (undefined);
};

DBFConverters.L = function (v) {
    return ("TY".includes(v.toUpperCase()));
};

DBFConverters.d = function (v) {
    return (v ? true : undefined);
};

DBFstream = {};

DBFstream.import = async function(fileName, params, cb) {
    var o = this;
    stream = fs.createReadStream(fileName);

    const PREHEADER = 0;
    const HEADER = 1;
    const RECORD = 2;

    var state = PREHEADER;
    var need = 10;
    var have = 0;
    var chunks = [];
    
    stream.on('data', function (chunk) {
        chunks.push(chunk);
        have += chunk.length;
        while (have >= need) {
            var buf = chunks.length == 1 ? chunks[0] : Buffer.concat(chunks);
            chunks = [ buf.slice(need) ];
            buf = buf.slice(0,need);
            have -= buf.length;

            switch (state) {
            case PREHEADER:
                var version = buf.readUInt8(0);
                if (version != 0x03 && version != 0x30) {
                    throw new Error('Not a supported DBF file');
                }
                var hdrSize = buf.readUInt16LE(8);
                
                // Unread the preheader, then read the rest of the header.
                have += buf.length;
                need = hdrSize;
                chunks.unshift(buf);
                state = HEADER;
                break;
                
            case HEADER:
                var lastmod = new Date(
                    buf.readUInt8(1)+2000,
                    buf.readUInt8(2),
                    buf.readUInt8(3)
                );
                var nRec = buf.readUInt32LE(4);
                var recSize = buf.readUInt16LE(10);
                var fields = {
                    _deleted: new DBFField(0, '_deleted', 'd', 1, 0)
                };
                let recOff = 1;
                for (var off = 32; buf.readUInt8(off) != 0x0d; off += 32) {
                    let f = DBFField.fromBuffer(recOff,
                        buf.subarray(off, off+32));
                    fields[f.name] = f;
                    recOff += f.length;
                }
                assert(recOff == recSize,
                    'fields did not total to record size');
                need = recSize;
                state = RECORD;
                break;

            case RECORD:
                // NEEDSWORK might need to look for ^Z or number of
                // records here.
                var r = {};
                for (fn in fields) {
                    r[fn] = fields[fn].get(buf);
                }
                cb(r);
                break;
            }
        }
    });

    return (new Promise(function (resolve, reject) {
        stream.on('end', function () {
            // Note:  we ignore a partial record.
            stream.close();
            delete stream;
            resolve();
        });
    }));
};

module.exports = exports = DBFstream;
