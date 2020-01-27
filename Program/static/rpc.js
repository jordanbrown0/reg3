var rpc = {};
var rpcVerbose = false;
var rpcActive = {};
var rpcFailed = false;

init.push(function rpcInit(cb) {
    if (rpcVerbose) {
        log('Initializing RPC');
    }
    var serial = 0;
    function call(params, callback) {
        var x = new XMLHttpRequest();
        var myserial = serial++;
        x.onload = function() {
            delete rpcActive[myserial];
            var response = JSON.parse(x.responseText);
            if (rpcVerbose) {
                log(myserial, '<==', response);
            }
            runcallback(function () { callback(response); })
        };
        x.onerror = rpcError;
        x.open('PUT', '/Call');
        x.setRequestHeader('Content-Type', 'application/json');
        if (rpcVerbose) {
            log(myserial, '==>', params);
        }
        x.send(JSON.stringify(params));
        rpcActive[myserial] = x;
    }

    function addmethod(m) {
        rpc[m] = function() {
            if (rpcFailed) {
                return;
            }
            var args = Array.prototype.slice.call(arguments);
            var success = null;
            var failure = null;
            while (args.length > 0 && !failure) {
                var cb = args.pop();
                if (cb instanceof Function) {
                    failure = success;
                    success = cb;
                    continue;
                }
                args.push(cb);
                break;
            }
            call({name: m, params: args}, function (r) {
                if (r.error) {
                    if (failure) {
                        failure(r.error);
                    } else {
                        throw (new Error(r.error));
                    }
                } else {
                    if (success) {
                        success(r.response);
                    }
                }
            });
        };
    }

    function addmethods(a) {
        for (var i = 0; i < a.length; i++) {
            addmethod(a[i]);
        }
    }

    call({name: 'methods', params: []}, function(r) {
        addmethods(r.response);
        if (rpcVerbose) {
            log('RPC ready');
        }
        cb();
    });
    return (true);
});

function rpcError(e) {
    log('RPC error', e);
    // Abort all active RPC requests.
    for (var ser in rpcActive) {
        rpcActive[ser].abort();
        delete rpcActive[ser];
    }
    
    rpcFailed = true;

    // This is kind of un-generic.  Perhaps the application
    // should tell us a handler to call.  But then the application
    // would need to have a way to ping, preferably without
    // triggering the logging and whatnot associated with a real
    // request.
    base.switchTo(new WaitServer());
}

function rpcRestored() {
    rpcFailed = false;
    home();
}

function isRPCActive() {
    for (ser in rpcActive) {
        return (true);
    }
    return (false);
}

// Tell the user we're waiting for the server.
// Perhaps this should be more popup-y.
function WaitServer() {
    var o = this;
    WaitServer.sup.constructor.call(o, 'div');
}
extend(DElement, WaitServer);

WaitServer.prototype.activate = function () {
    var o = this;
    var t0 = Date.now();
    function ping() {
        var now = Date.now();
        o.removeChildren();
        o.appendChild('Communications error.  Waiting for server.  Waited '
            + Math.round((now-t0)/1000) + ' seconds.');

        var x = new XMLHttpRequest();
        x.onload = function() {
            // Note that this might be some time after the request, so we get
            // a new Date.now().
            log('RPC service restored after', Math.round((Date.now()-t0)/1000),
                'seconds');
            rpcRestored();
        };
        x.onerror = function (e) {
            var now2 = Date.now();
            x.abort();
            // We wait at least 5 seconds, but for a simple
            // connection refusal Firefox seems to have already
            // waited 6 seconds.
            setTimeout(ping, Math.max(5000 - (now2-now), 0));
        };
        x.open('PUT', '/Call');
        x.setRequestHeader('Content-Type', 'application/json');
        x.send(JSON.stringify({ name:'nop', params: []}));
    }
    ping();
};

WaitServer.prototype.title = "Uh oh...";

// Pseudo-REST support
//
// This is kind of half RPC and half REST.
// For upload, you PUT a file and get back RPC results.
// For download, you POST an RPC request and download a file.
//
// One might imagine a mechanism that would carry a file
// and request in a multi-part POST or PUT, and would carry
// a file and response in a multi-part response.  However,
// while the protocol would allow it I don't think the browser
// would cooperate in either direction.
//
var REST = {};

REST.upload = function (url, file, cb) {
    var x = new XMLHttpRequest();
    x.open('PUT', url);
    x.onload = function () {
        var res = JSON.parse(x.responseText);
        if (rpcVerbose) {
            log('REST <==', res);
        }
        cb(res);
    };
    x.onerror = rpcError;
    if (rpcVerbose) {
        log('REST ==>', file.name);
    }
    x.send(file);
};

REST.exportDB = function (name) {
    REST.download('exportDB', Array.apply(null, arguments));
};

REST.download = function (method, params) {
    var form = new DElement('form', {
        target: "_blank",
        method: "POST",
        action: "/REST"
    });
    form.appendChild(new DElement('input', {
        type: 'hidden',
        name: 'request',
        value: JSON.stringify({name: method, params: params})
    }));
    document.body.appendChild(form.n);
    setTimeout(function () {
        // NEEDSWORK:  I don't know of any way to detect an error here.
        form.n.submit();
        document.body.removeChild(form.n);
    });
};