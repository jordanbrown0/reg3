// Read CSV files
const fs = require('fs');
const Import = require('./Import');
const { assert } = require('./utils');

function CSV(fileName, params) {
    var o = this;
    o.fileName = fileName;
    assert(params.map, 'No map');
    o.map = [];
    params.map.forEach(function (ent) {
        var cnvfunc = Import.converters[ent.conversion];
        assert(cnvfunc, 'Bad conversion '+ent.conversion);
        o.map.push({
            from: ent.from.toLowerCase(),
            to: ent.to,
            convert: cnvfunc            
        });
    });
    o.headers = params.headers;
}

CSV.prototype.all = async function(cb) {
    var o = this;
    const stream = fs.createReadStream(o.fileName);

    const NORMAL = 0;
    const INQUOTE = 1;
    const QUOTEQUOTEMAYBE = 2;
    const CRLFMAYBE = 3;
    const QUOTEQUOTE = 4;
    const QUOTECRLFMAYBE = 5;
    
    var fieldNames = null;
    var state = NORMAL;
    var curField = '';
    var r = [];
    stream.on('data', function (buf) {
        var s = buf.toString('ascii');    // NEEDSWORK UTF-8?
        var start = 0;
        var i;
        for (i = 0; i < s.length; i++) {
            var c = s[i];
            switch (state) {
            case QUOTEQUOTEMAYBE:
                switch (c) {
                case '"':
                    state = QUOTEQUOTE;
                    break;
                default:
                    state = NORMAL;
                    break;
                }
                break;
            case CRLFMAYBE:
                state = NORMAL;
                if (c == '\n') {
                    emitSubstring();    // Skip over the \n.
                    continue;
                }
                break;
            case QUOTECRLFMAYBE:
                state = INQUOTE;
                if (c == '\n') {
                    emitSubstring();    // Skip over the \n.
                    continue;
                }
                break;
            }
            switch(state) {
            case NORMAL:
                switch (c) {
                case ',':
                    emitSubstring();
                    emitField();
                    break;
                case '"':
                    emitSubstring();
                    state = INQUOTE;
                    break;
                case '\r':
                    emitSubstring();
                    emitField();
                    emitRecord();
                    state = CRLFMAYBE;
                    break;
                case '\n':
                    emitSubstring();
                    emitField();
                    emitRecord();
                    break;
                }
                break;
            case INQUOTE:
                switch (c) {
                case '"':
                    emitSubstring();
                    state = QUOTEQUOTEMAYBE;
                    break;
                case '\r':
                    emitSubstring();
                    curField += '\n';
                    state = QUOTECRLFMAYBE;
                    break;
                case '\n':
                    // This is actually a normal case, but seems worth
                    // calling out for its lack of special handling.
                    break;
                }
                break;
            case QUOTEQUOTE:
                state = INQUOTE;
                break;
            }
        }

        emitSubstring();
        
        // Emit (append to curField) a substring starting at start and
        // ending before the current character.  Then skip over that
        // character.
        function emitSubstring() {
            curField += s.slice(start, i);
            start = i+1;
        }
        function emitField() {
            r.push(curField);
            curField = '';
        }
        function emitRecord() {
            var j;
            if (o.headers) {
                if (!fieldNames) {
                    // First line, gather headers and skip.
                    fieldNames = [];
                    for (j = 0; j < r.length; j++) {
                        fieldNames[j] = r[j].toLowerCase();
                    }
                    r = [];
                    return;
                }
                // Translate Array into { name: val } object.
                var tmp = {};
                for (j = 0; j < r.length; j++) {
                    tmp[fieldNames[j]] = r[j];
                }
                r = tmp;
            }
            // Now we have either a { name: val } object or
            // an Array, which is effectively a { num: val } object.
            var obj = {}
            o.map.forEach(function (m) {
                obj[m.to] = m.convert(r[m.from]);
            });
            cb(obj);
            r = [];
        }
    });
    
    return (new Promise(function (resolve, reject) {
        stream.on('end', function () {
            // Note:  we ignore a final line that does not end in a newline.
            // This avoids having to distinguish a data line that does not
            // end in a newline (which would generate a record) from an empty
            // line which does not end in a newline.
            stream.close();
            console.log('finished import', o.fileName);
            resolve();
        });
    }));
};


    // o.fields.forEach(function (f) {
        // var s = buf.toString('ascii', f.off, f.off+f.length).trimEnd()
        // switch (f.type) {
        // case 'N':
            // ret[f.name] = parseFloat(s);
            // break;
        // case 'd':
            // if (s) {
                // rec[f.name] = true;
            // }
            // break;
        // default:
            // ret[f.name] = s;
            // break;
        // }
    // });
    // return (ret);

module.exports = exports = CSV;
