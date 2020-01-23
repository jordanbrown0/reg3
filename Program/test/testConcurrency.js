const Concurrency = require('./Concurrency.js');

async function millisleep(n) {
	return (new Promise(function (resolve, reject) {
		setTimeout(resolve, n);
	}));
}

var once = new Concurrency.Once();

setTimeout(async function () {
	console.log('second try');
	await once.do(function () {
		console.log('second try should not get here');
	});
	console.log('second try done');
}, 1000);
setTimeout(async function () {
	console.log('third try');
	await once.do(function () {
		console.log('third try should not get here');
	});
	console.log('third try done');
}, 2000);

async function first() {
	console.log('first try');
	await once.do(async function () {
		console.log('first try should get here, sleeping');
		await millisleep(10000);
		console.log('first try awake');
	});
	console.log('first try done');
}

first();
	