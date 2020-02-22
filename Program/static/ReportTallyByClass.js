function ReportTallyByClass()
{
    var o = this;
    ReportTallyByClass.sup.constructor.call(o);
}
extend(Report, ReportTallyByClass);

ReportTallyByClass.prototype.body = function (cb) {
    var o = this;
    
    table.members.reduce(
        { expr: 
            { if: [
                { f: 'void' },
                { addto: [ '', 1 ] },
                { addto: [ {f: 'class'}, 1 ] }
            ]}
        },
        gotTotals
    );

    function gotTotals(totals) {
        o.totals = totals;
        table.classes.list({ sort: [ 'order' ] }, gotClasses);
    }

    function gotClasses(classes) {
        var voidTotal = o.totals[''];
        delete o.totals[''];
        var body = [];
        
        var grand = 0;
        forEachArrayObject(classes, function (k, c) {
            grand += (o.totals[c.code] || 0);
            body.push(tr(
                td(o.totals[c.code] || ''),
                td(c.description)
            ));
            delete o.totals[c.code];
        });

        for (var code in o.totals) {
            body.push(tr(
                td(o.totals[code] || ''),
                td('Bad code "' + code + '"')
            ));
        }

        body.push(tr(td(grand), td('Grand total')));
        body.push(tr(td(voidTotal||0), td('Void')));
        
        cb(body);
    }
};

ReportTallyByClass.prototype.header = function () {
    return (tr(th('Memberships by class', { colSpan: 2 })));
};

ReportTallyByClass.prototype.title = 'Reports';
