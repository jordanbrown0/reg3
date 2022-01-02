
function Header() {
    var o = this;
    Header.sup.constructor.call(o, 'div', {
        className: 'Header',
        // This is interesting, in that we could make it so that focusing
        // the base automatically re-focused on a field, but IE doesn't seem
        // to believe in focusing on the base.
        // tabIndex: 0,
        // onfocus: function () { console.log('Base focus'); },
        // onblur: function () { console.log('Base blur'); }
    });
    var help = new Button('?', {
        onclick: function () { Help.pop(); },
        id: 'headerHelp'
    });
    rpc.release(function (Release) {
        help.setProperties({title: Release.name});
    });
    o.clock = new DElement('div');
    o.numberRemaining = new DElement('div');
    var rightText = new DElement('div', { id: 'rightText' },
        o.clock, o.numberRemaining);
    var right = new DElement('span', { id: 'headerClock' }, rightText, help);

    o.title = new DElement('span', { id: 'headerTitle'});
    o.appendChild(o.title, right);
}

extend(DElement, Header);

Header.prototype.activate = function () {
    var o = this;
    o.tick();
    setInterval(function () { o.tick(); }, 60*1000);
};

Header.prototype.tick = function () {
    var o = this;
    rpc.eval(null, {dateTime: []}, function (d) {
        o.clock.replaceChildren(LDate.fromJSON(d).toDisplay({seconds: false}));
        Server.getMembershipNumbers(function (mn) {
            var s;
            if (mn.lastNumber == null || mn.nextNumber == null) {
                s = 'Member numbers not configured';
            } else if (mn.nextNumber > mn.lastNumber) {
                s = 'No member numbers left';
            } else {
                s = (mn.lastNumber - mn.nextNumber + 1) + ' member numbers left';
            }
            o.numberRemaining.replaceChildren(s);
        });
    });
};

Header.prototype.setTitle = function (title) {
    var o = this;

    o.title.replaceChildren(title);
};
