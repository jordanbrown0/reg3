window.onload = function () {
    helpCommon('Common');

    document.body.appendChild(helpAddenda);
}

var helpAddenda = document.createElement('div');

function helpElem(/*...*/) {
    var ret = undefined;
    for (var i = 0; i < arguments.length; i++) {
        ret = arguments[i];
        helpAddenda.appendChild(ret);
    }
    return (ret);
}

function helpCreateElem(/*...*/) {
    var ret = undefined;
    for (var i = 0; i < arguments.length; i++) {
        ret = helpElem(document.createElement(arguments[i]));
    }
    return (ret);
}

function helpLoad(/*...*/) {
    for (var i = 0; i < arguments.length; i++) {
        var node = helpCreateElem('div');
        var req = new XMLHttpRequest();
        req.open('GET', arguments[i]+'.html');
        req.onload = function () {
            node.innerHTML = req.responseText;
        };
        req.send();       
    }
}

function helpCommon(/*...*/) {
    for (var i = 0; i < arguments.length; i++) {
        helpCreateElem('p');
        helpCreateElem('hr');
        helpLoad('Common/' + arguments[i]);
    }
}

document.documentElement.onkeydown = function (e) {
    if (e.key == 'Escape') {
        window.close();
    }
};
