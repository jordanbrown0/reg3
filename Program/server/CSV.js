// Read and write CSV files
import fs from 'fs';
import { assert, log, streamWrapper, streamWritePromise } from './utils.js';

var CSV = {};

CSV.import = async function(path, params, cb) {
    var o = this;
    const stream = fs.createReadStream(path, {encoding: params.encoding});

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
    function dataHandler(s) {
        var start = 0;
        var i;
        for (i = 0; i < s.length; i++) {
            var c = s[i];
            if (c == '\uFEFF') {
                // BOM / Zero-width non-breaking space
                // Ignore it, and skip over it.
                emitSubstring();
                continue;
            }

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
            if (params.headers) {
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
                let tmp = {};
                for (j = 0; j < r.length; j++) {
                    tmp[fieldNames[j]] = r[j];
                }
                r = tmp;
            } else {
                let tmp = {};
                for (j = 0; j < r.length; j++) {
                    tmp[j+1] = r[j];
                }
                r = tmp;
            }
            cb(r);
            r = [];
        }
    }
    stream.on('data', streamWrapper(dataHandler));
    return (new Promise(function (resolve, reject) {
        stream.on('end', function () {
            // Note:  we ignore a final line that does not end in a newline.
            // This avoids having to distinguish a data line that does not
            // end in a newline (which would generate a record) from an empty
            // line which does not end in a newline.
            stream.close();
            resolve();
        });
        stream.on('error', function (e) {
            log('CSV import encountered an error: '+e.toString());
            stream.close();
            reject(e);
        });
    }));
};

CSV.extension = 'csv';
CSV.mimeType = 'text/csv';

var first = true;

function toCSVArray(a, params) {
    let csv = [];
    a.forEach(function (e) {
        csv.push(toCSV1(e, params));
    });
    return (csv.join(','));
}

function toCSV1(v, params) {
    if (v == undefined) {
        v = "";
    } else if (v instanceof Array) {
        v = toCSVArray(v, params);
    } else {
        v = v.toString();
    }
    if (/[",\r\n]/.test(v)) {
        return ('"' + v.replace(/"/g, '""') + '"');
    } else {
        return (v);
    }
}

function toCSV(r, params) {
    let csv = [];
    params.map.forEach(function (m) {
        csv.push(toCSV1(r[m.from], params));
    });
    return csv.join(',') + '\n';
}

CSV.export = async function (res, t, params) {
    if (params.headers) {
        let header = {};
        params.map.forEach(function (m) {
            header[m.from] = m.to;
        });
        await streamWritePromise(res,
            Buffer.from(toCSV(header, params), params.encoding));
    }
    
    let n = 0;
    await t.forEachAsync(async function (k, r) {
        await streamWritePromise(res,
            Buffer.from(toCSV(r, params), params.encoding));
        n++;
    });
    return (n);
};

export { CSV };
