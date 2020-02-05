function ReportsByClass()
{
    var o = this;
    DElement.call(o, 'div', {className: 'ReportsByClass'});
}
extend(DElement, ReportsByClass);

ReportsByClass.prototype.activate = function () {
    var o = this;
    
    table.members.reduce(
        { expr: 
            { addto: [ {f: 'class'}, 1 ]}
        },
        gotTotals
    );

    function gotTotals(totals) {
        o.totals = totals;
        table.classes.list({ sort: [ 'order' ] }, gotClasses);
    }

    function gotClasses(classes) {
        var tbody = new DElement('tbody');
        var t = new DElement('table',
            new DElement('thead',
                tr(new DElement('th', 'Memberships by class', { colSpan: 2 }))
            ),
            tbody
        );

        var grand = 0;
        forEachArrayObject(classes, function (k, c) {
            if (c.code == cfg.voidClass) {
                voidClass = c;
                voidTotal = o.totals[c.code];
            } else {
                grand += (o.totals[c.code] || 0);
                tbody.appendChild(tr(
                    td(o.totals[c.code] || ''),
                    td(c.description)
                ));
            }
            delete o.totals[c.code];
        });

        for (var code in o.totals) {
            tbody.appendChild(tr(
                td(o.totals[code] || ''),
                td('Bad code "' + code + '"')
            ));
        }

        tbody.appendChild(tr(td(grand), td('Grand total')));
        tbody.appendChild(tr(td(voidTotal||''), td(voidClass.description)));
        
        o.appendChild(t);
        
        base.addNav([
            { key: 'P', msg: 'Print', func: function () {
                window.print();
            } },
            { key: 'Enter', msg: 'Done', func: home },
            { key: 'Escape', func: home }
        ]);
    
    }
};

ReportsByClass.prototype.title = 'Reports';
