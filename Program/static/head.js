console.log('Hello from JavaScript');

var init = [];

function errorEventToString(e) {
    return ([
        e.message,
        e.filename + ' line ' + e.lineno + ' col ' + e.colno,
        '',
        e.error.stack
    ].join('\n'));
}
window.addEventListener('error', function(e) {
    if (modal == undefined) {
        alert(errorEventToString(e));
    } else {
        modal(new DElement('pre', errorEventToString(e)));
    }
});
