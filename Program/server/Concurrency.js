// Concurrency tools

const { assert } = require('./utils.js');

Concurrency = {};

Concurrency.verbose = false;

//
// var once = new Concurrency.Once();
// await once.do(function () { /* run this once */ });
//
// Note that the caller must ensure that the Once object itself is created
// only once.
Concurrency.Once = function Once () {
    var o = this;
    o.mutex = new Concurrency.Mutex();
    o.first = true;
};

Concurrency.Once.prototype.do = async function (f) {
    var o = this;
    await o.mutex.acquire();
    if (o.first) {
        o.first = false;
        await f();
    }
    o.mutex.release();
};

// If the structure of the caller controls which thread is the first caller,
// Once.wait will let the second-and-later callers wait for the completion
// of the first call, without any implication that they might run the
// function.
Concurrency.Once.prototype.wait = async function () {
    var o = this;
    assert(!o.first, 'Once.wait called as the first caller');
    await o.mutex.acquire();
    o.mutex.release();
};

//
// This is a different style of Once.  I haven't decided which I like better.
//
// if (!once) {
//     once = new Once2(function () {
//         ... do this once ...
//     });
// }
// once.wait();
//
// It's a little twisted, since it makes it more obvious that the first caller
// runs "asynchronously", but it also makes it clear that there is one and only
// one function that is going to run.
// On the other hand, it requires the caller to arrange that the Once2 is
// created one time only, at the time that it's ready to run.  With a vanilla
// Once, you can create the Once during some initialization phase when you're
// single-threaded, and then execute it later.

Concurrency.Once2 = function Once2 (f) {
    var o = this;
    o.mutex = new Concurrency.Mutex();
    o.mutex.acquireAsserted();
    setTimeout(async function () {
        await f();
        o.mutex.release();
    });
};

Concurrency.Once2.prototype.wait = async function () {
    await o.mutex.acquire();
    o.mutex.release();
};

Concurrency.Mutex = function Mutex () {
    var o = this;
    o.busy = false;
    o.waiters = [];
};

Concurrency.Mutex.prototype.acquire = async function () {
    var o = this;
    Concurrency.log('acquire');
    if (!o.busy) {
        Concurrency.log('now busy');
        o.busy = true;
        return;
    }
    return (new Promise(function (resolve, reject) {
        Concurrency.log('waiting');
        o.waiters.push(function () {
            Concurrency.log('awoken');
            resolve();
        });
    }));
};

Concurrency.Mutex.prototype.acquireAsserted = function () {
    assert(!o.busy, 'Mutex.acquireAsserted called on busy mutex');
    o.busy = true;
};

Concurrency.Mutex.prototype.release = function () {
    var o = this;
    Concurrency.log('release');
    var f = o.waiters.shift();
    if (f) {
        Concurrency.log('waking waiter');
        setTimeout(f);
    } else {
        Concurrency.log('no waiters');
        o.busy = false;
    }
};

// Run a function under the mutex.  Always releases the mutex before returning,
// even when the function throws an exception.  Caution:  maybe releasing on
// exception isn't a good thing; a function that unexpectedly throws an
// exception might not have left the protected data structure in a good state.
// But then again if you weren't intentionally throwing then you probably
// won't catch and the program will abort (well, maybe), and if you were
// intentionally throwing and catching then you already need to handle
// unexpected throws.
Concurrency.Mutex.prototype.run = async function (f) {
    var o = this;
    await o.mutex.acquire();
    try {
        await f();
    } finally {
        o.mutex.release();
    }
};

Concurrency.log = function (/*arguments*/) {
    if (Concurrency.verbose) {
        console.log.apply(console, arguments);
    }
};

module.exports = exports = Concurrency;
