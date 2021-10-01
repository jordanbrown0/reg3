window.onload = function () {
    function loadNext() {
        var n = toLoad.shift();
        if (!n) {
            return;
        }
        var req = new XMLHttpRequest();
        req.open('GET', n+'.html');
        req.onload = function () {
            document.body.appendChild(document.createElement('p'));
            document.body.appendChild(document.createElement('hr'));
            var node = document.createElement('div');
            node.innerHTML = req.responseText;
            document.body.appendChild(node);
        };
        req.send();
        loadNext();
    }
    loadNext();
}

var toLoad = [];

function helpLoad(/*...*/) {
    for (var i = 0; i < arguments.length; i++) {
        toLoad.push(arguments[i]);
    }
}
