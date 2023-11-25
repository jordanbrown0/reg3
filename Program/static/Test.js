function Test()
{
    var o = this;
    Test.sup.constructor.call(o, 'div');
    o.menu = new Menu({ items: [
        {
            label: 'Is server alive?',
            func: function () { rpc.nop(function () { alert('Yes!'); }) }
        },
        {
            label: 'List tables',
            func: function () {
                db.test.listTables(
                    function (tables) { alert(Object.keys(tables)); });
            }
        },
        {
            label: 'Add records',
            func: function () {
                o.populate(function () { alert('populated'); }, 100);
            }
        },
        {
            label: 'Test list()',
            func: function () { o.testList(); }
        },
        {
            label: 'Test reduce()',
            func: function () { o.testReduce(); }
        },
        {
            label: 'Test put() with expression',
            func: function () { o.testPutExpr(); }
        },
        {
            label: 'Test getOrAdd() with expression',
            func: function () { o.testGetOrAddExpr(); }
        },
        {
            label: 'Test add() with expression',
            func: function () { o.testAddExpr(); }
        },
        {
            label: 'Test update()',
            func: function () { o.testUpdate(); }
        },
        {
            label: 'Test InputFilter',
            func: function () { o.testInputFilter(); }
        },
        {
            label: 'Test Import Converters',
            func: function () { o.testImportConverters(); }
        }
    ]});
    o.appendChild(o.menu);
}

extend(DElement, Test); 

Test.prototype.activate = function () {
    var o = this;
    Test.sup.activate.call(o);
    o.menu.activate();
};

Test.prototype.title = 'Tests';

Test.prototype.testList = function () {
    var o = this;
    function zap() {
        table.test.zap(populate);
    }
    function populate() {
        o.populate(list1, 20);
    }
    function list1() {
        table.test.list({ limit: 3 }, list2);
    }
    function list2(recs) {
        assert(recs.length == 3, 'list1 failed '+recs.length);
        table.test.list({ filter: { f: 'b' } }, list3);
    }
    function list3(recs) {
        assert(recs.length == 10, 'list2 failed '+recs.length);
        recs.forEach(function (k, r) {
            assert(r.b, 'list2 failed filter');
        });
        alert('OK');
    }
    zap();
};

Test.prototype.testReduce = function () {
    var o = this;
    function zap() {
        table.test.zap(populate);
    }
    function populate() {
        o.populate(reduce1, 20);
    }
    function reduce1() {
        var expr =
            {if: [
                {lt: [
                    {f: 'n'},
                    6
                ]},
                {delete: null},
                {addto: [ 'n', 1 ]}
            ]};
        table.test.reduce({ init: { n: 0 }, expr: expr }, reduce2);
    }
    function reduce2(res) {
        assert(res.n == 15, 'reduce1 count wrong '+res.n);
        table.test.list({}, reduce3);
    }
    function reduce3(recs) {
        assert(recs.length == 15, 'reduce2 failed '+recs.length);
        recs.forEach(function (k, r) {
            assert(r.n >= 6, 'reduce2 failed filter');
        });
        alert('OK');
    }
    zap();
};

Test.prototype.testPutExpr = function () {
    var o = this;
    var k;
    function zap() {
        table.test.zap(populate);
    }
    function populate() {
        table.test.add(null, {n: 1}, null, get);
    }
    function get(k_) {
        k = k_;
        table.test.get(k, put);
    }
    function put(r) {
        log('before', r);
        var expr = {setf: [ 'n', {add: [ {f: 'n' }, 1 ]}]};
        table.test.put(k, r, expr, get2);
    }
    function get2() {
        table.test.get(k, got);
    }
    function got(r) {
        log('after', r);
        assert(r.n == 2, 'wrong '+r.n);
        alert('OK');
    }
    zap();
};

Test.prototype.testGetOrAddExpr = function () {
    var o = this;
    function zap() {
        table.test.zap(add1);
    }
    function add1() {
        table.test.getOrAdd('a', {a: 1}, {setf: ['b', 1]}, get1);
    }
    function get1(r) {
        assert(r.a==1, 'add1 wrong a '+r.a);
        assert(r.b==1, 'add1 wrong b '+r.b);
        table.test.getOrAdd('a', {a: 2}, {setf: ['b', 2]}, get2);
    }
    function get2(r) {
        assert(r.a==1, 'get1 wrong a '+r.a);
        assert(r.b==1, 'get1 wrong b '+r.b);
        alert('OK');
    }
    zap();
};

Test.prototype.testAddExpr = function () {
    var o = this;
    function zap() {
        table.test.zap(add1);
    }
    function add1() {
        table.test.add('a', {a: 1}, {setf: ['b', 1]}, get1);
    }
    function get1(k) {
        table.test.get('a', get2);
    }
    function get2(r) {
        assert(r.a==1, 'get1 wrong a '+r.a);
        assert(r.b==1, 'get1 wrong b '+r.b);
        alert('OK');
    }
    zap();
};

Test.prototype.testUpdate = function () {
    var o = this;
    function zap() {
        table.test.zap(add1);
    }
    function add1() {
        table.test.add('a', {a: 1, b:2, c:3}, null, update1);
    }
    function update1() {
        table.test.update('a', {b: 3}, {setf: ['c', 4]}, get1);
    }
    function get1(k) {
        table.test.get('a', get2);
    }
    function get2(r) {
        assert(r.a==1, 'get1 wrong a '+r.a);
        assert(r.b==3, 'get1 wrong b '+r.b);
        assert(r.c==4, 'get1 wrong c '+r.c);
        alert('OK');
    }
    zap();
};

Test.prototype.testImportConverters = function () {
    var o = this;
    var tests = [
        { c: 'null', v: 'x', r: 'x' },
        { c: 'null', v: null, r: undefined },
        { c: 'null', v: undefined, r: undefined },
        { c: 'null', v: '', r: undefined },
        { c: 'number', v: '123', r: 123 },
        { c: 'number', v: '-123', r: -123 },
        { c: 'number', v: '$123.45', r: 123.45 },
        { c: 'number', v: undefined, r: undefined },
        { c: 'number', v: null, r: undefined },
        { c: 'number', v: '', r: undefined },
        // { c: 'number', v: {}, r: undefined },
        { c: 'number', v: '-', r: undefined },
        { c: 'number', v: '.', r: undefined },
        // { c: 'number', v: '1.5.5', r: undefined },
        { c: 'datev2', v: '07/26/1961 18:43:00', r: '1961-07-26T18:43:00' },
        { c: 'datev2', v: '01/17/02 12:34:56', r: '2002-01-17T12:34:56' },
        { c: 'datev2', v: '07/26/1961', r: '1961-07-26' },
        { c: 'datev2', v: '01/17/02', r: '2002-01-17' },
        { c: 'datev2', v: '', r: undefined },
        { c: 'mmddyyyy', v: '07/26/1961', r: '1961-07-26' },
        { c: 'mmddyyyy', v: '01/17/02', r: '2002-01-17' },
        { c: 'mmddyyyy', v: '1/2/3', r: '2003-01-02' },
        { c: 'mmddyyyy', v: ' 1/ 2/ 3', r: '2003-01-02' },
        { c: 'mmddyyyy', v: '', r: undefined },
        { c: 'ddmmyyyy', v: '26/07/1961', r: '1961-07-26' },
        { c: 'ddmmyyyy', v: '17/01/02', r: '2002-01-17' },
        { c: 'ddmmyyyy', v: '1/2/3', r: '2003-02-01' },
        { c: 'ddmmyyyy', v: ' 1/ 2/ 3', r: '2003-02-01' },
        { c: 'ddmmyyyy', v: '', r: undefined },
        // Note:  yyyymmdd allows "UTC" at end to convert from UTC to
        // local time.  We don't know local TZ so don't test that case.
        { c: 'yyyymmdd', v: '1961-07-26 01:02:03', r: '1961-07-26T01:02:03' },
        { c: 'yyyymmdd', v: '02/01/17 1: 2: 3', r: '2002-01-17T01:02:03' },
        // Note that TZ correction will introduce a time.
        { c: 'yyyymmdd', v: '1/2/3', r: '2001-02-03T00:00:00' },
        { c: 'yyyymmdd', v: ' 1/ 2/ 3', r: '2001-02-03T00:00:00' },
        { c: 'yyyymmdd', v: '', r: undefined },
        { c: 'dateMS', v: '07/26/1961 6:43pm', r: '1961-07-26T18:43:00' },
        { c: 'dateMS', v: '01/17/02 1:2am', r: '2002-01-17T01:02:00' },
        { c: 'dateMS', v: '1/2/3 4:56PM', r: '2003-01-02T16:56:00' },
        { c: 'dateMS', v: ' 1/ 2/ 3 4:56AM', r: undefined },
        { c: 'dateMS', v: '1/2/3 4: 6AM', r: undefined },
        { c: 'dateMS', v: '', r: undefined },
        { c: 'phone', v: '+1 818 555 1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '818 555 1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '818-555-1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '+1 818-555-1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '818/555.1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '(818)555-1212', r: '+1 (818)555-1212' },
        { c: 'phone', v: '+44 123 456 789', r: '+44 123 456 789' },
        { c: 'phone', v: '', r: undefined },
    ];
    var i = 0;
    function testOne(res) {
        var t;
        if (i > 0) {
            t = tests[i-1];
            assert(res === t.r, t.c+'('+t.v+')='+res+' should be ' + t.r);
        }
        if (i < tests.length) {
            t = tests[i];
            i++;
            rpc.importConverter(t.c, t.v, testOne);
        } else {
            alert('OK');
        }
    }
    testOne();
};

Test.prototype.testInputFilter = function () {
    base.switchTo(new TestInputFilter());
};

Test.prototype.populate = function (cbDone, n) {
    var o = this;
    function addOne(cbNext, i) {
        table.test.add(null, {s: 's'+i, n: i, b: i%2==0}, null, cbNext);
        return (true);
    }
    range(addOne, cbDone, 1, n);
};


// Stubs to make the test UI work.
// The real versions of these should really plug themselves in, so that the
// test UI can plug in alternates.

function Header() {
    var o = this;
    Header.sup.constructor.call(o, 'div', {
        className: 'Header',
    });
    o.title = new DElement('span', { id: 'headerTitle'});
    o.appendChild(o.title);
}

extend(DElement, Header);

Header.prototype.setTitle = function (title) {
    var o = this;
    o.title.replaceChildren(title);
};

function testHome() {
    base.switchTo(new Test());
}

function TestInputFilter() {
    var o = this;
    TestInputFilter.sup.constructor.call(o, 'div');
    o.filter = new InputFilter({});
    o.appendChild(o.filter);
}
extend(DElement, TestInputFilter);

TestInputFilter.prototype.activate = function () {
    var o = this;

    function dump() {
        console.log('Validate', o.filter.validate());
        var f = o.filter.get();
        console.log('Filter', f);
        console.log('Expression', Filter.compile(f));
    }
    base.addNav([
        { label: 'Dump', key: 'Enter', order: 1, func: dump },
    ]);

    base.addCancel(testHome);
}

init.push(function testInit() {
    table.test = new DBTable(db.test, 'test', { });
    testHome();
});
