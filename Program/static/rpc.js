var rpc = {};
var rpcActive = {};
var rpcFailed = false;

init.push(function rpcInit(cb) {
    Debug.rpc('Initializing RPC');
    var serial = 0;
    function call(params, callback) {
        var x = new XMLHttpRequest();
        var myserial = serial++;
        x.onload = function() {
            delete rpcActive[myserial];
            var response = JSON.parse(x.responseText);
            Debug.rpc(myserial, '<==', response);
            runcallback(function () { callback(response); })
        };
        x.onerror = rpcError;
        x.open('PUT', '/Call');
        x.setRequestHeader('Content-Type', 'application/json');
        Debug.rpc(myserial, '==>', params);
        x.send(JSON.stringify(params));
        rpcActive[myserial] = {xhr: x, params: params};
    }

    function addmethod(m) {
        rpc[m] = function() {
            if (rpcFailed) {
                log('RPC dropping rpc.'+m);
                return;
            }
            var args = Array.prototype.slice.call(arguments);
            var success = null;
            var failure = null;
            while (args.length > 0 && !failure) {
                var f = args.pop();
                if (f instanceof Function) {
                    failure = success;
                    success = f;
                    continue;
                }
                args.push(f);
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
        Debug.rpc('RPC ready');
        cb();
    });
    return (true);
});

function rpcError(e) {
    log('RPC error', e);
    // Abort all active RPC requests.
    for (var ser in rpcActive) {
        log('RPC aborting rpc.' + rpcActive[ser].params.name);
        rpcActive[ser].xhr.abort();
        delete rpcActive[ser];
    }

    rpcFailed = true;

    // This is kind of un-generic.  Perhaps the application
    // should tell us a handler to call.  But then the application
    // would need to have a way to ping, preferably without
    // triggering the logging and whatnot associated with a real
    // request.
    // Note that we must not call the current page's deactivate method,
    // because it might try to make an RPC call... as Home.deactivate does.
    base.switchToNoDeactivate(new WaitServer());
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
//
// For upload, you PUT a multi-part form with a request and a file.
// NEEDSWORK:  This really belongs better integrated into the primary RPC
// mechanism, since it is now mostly the same.
//
// For download, you POST an RPC request and download a file.
// One might imagine a mechanism that return
// a file and response in a multi-part response.  However,
// while the protocol would allow it I don't think the browser
// would cooperate.
// This might be part of the picture:
// function download(filename, text) {
//   var element = document.createElement('a');
//   element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
//   element.setAttribute('download', filename);
//   element.style.display = 'none';
//   document.body.appendChild(element);
//   element.click();
//   document.body.removeChild(element);
// }
//
var REST = {};

REST.importResync = function (dbName, file, cb) {
    RESTupload('importResync', file, [dbName], cb);
};

REST.importDBF = function (file, dbName, tName, map, cb) {
    RESTupload('importDBF', file, [dbName, tName, map], cb);
};

REST.importCSV = function (file, dbName, tName, map, headers, cb) {
    RESTupload('importCSV', file, [dbName, tName, map, headers], cb);
};

RESTupload = function (m, file, args, success) {
    Debug.rpc(m, 'file', args);
    var x = new XMLHttpRequest();
    x.open('PUT', '/CallMulti');
    x.onload = function () {
        var r = JSON.parse(x.responseText);
        Debug.rpc('REST <==', r);
        if (r.error) {
            // Conventional JSON-RPC above has an optional failure callback.
            // Hasn't seemed necessary here yet.
            throw (new Error(r.error));
        } else {
            if (success) {
                success(r.response);
            }
        }
    };
    x.onerror = rpcError;
    Debug.rpc('REST ==>', file.name);
    var formData = new FormData();
    if (file) {
        formData.append('file', file);
    }
    formData.append('request', JSON.stringify({name: m, params: args}));
    x.send(formData);
};

REST.exportResync = function (name) {
    var args = Array.prototype.slice.call(arguments);
    RESTdownload('exportResync', args);
};

RESTdownload = function (method, params) {
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
        // Or, for that matter, to detect completion.
        form.n.submit();
        document.body.removeChild(form.n);
    });
};