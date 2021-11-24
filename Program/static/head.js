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
    if (!base) {
        alert(errorEventToString(e));
    } else {
        modal(new DElement('pre', errorEventToString(e)));
    }
});

var unloadOK = false;

window.addEventListener('beforeunload', function (e) {
    if (unloadOK) {
        return;
    }
    // Cancel the event
    e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = 'blah';
});
