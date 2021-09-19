const { mkdate, assert, log } = require('./utils.js');
const DBMS = require('./DBMS');
const DBF = require('./DBFstream');
const CSV = require('./CSV');

var Export = {};

Export.formats = {};
Export.formats.CSV = CSV;
Export.formats.DBF = DBF;
Export.formats.CSVh = {
    export: function (res, t, params) {
        params.headers = true;
        return (CSV.export(res, t, params));
    },
    extension: CSV.extension,
    mimeType: CSV.mimeType
};

Export.export = async function (res, t, params) {
    let t0 = Date.now();
    let format = Export.formats[params.type];
    assert(format, 'Bad format '+params.type);
    let exporter = format.export;
    assert(exporter, 'No exporter for '+params.type);
    let fileName = t.getDBName()+'-'+t.getName()+'.'+format.extension;
    res.attachment(fileName);
    res.type(format.mimeType);
    let n = await exporter(res, t, params);
    log('exported',n,'records to', fileName,
        'took', Date.now()-t0, 'ms');
};

module.exports = exports = Export;
