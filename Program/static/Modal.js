function Modal(contents, params) {
    var o = this;
    Modal.sup.constructor.call(o, 'div', {className: 'ModalBackground'});

    var body = new DElement('div', { className: 'ModalBody' }, contents);

    var row = tr();
    if (params.ok) {
        row.appendChild(td(new Button('OK', {
            onclick: function () { params.ok(); }
        })));
    }
    if (params.cancel) {
        row.appendChild(td(new Button('Cancel', {
            onclick: function () { params.cancel(); }
        })));
    }

    var buttons = new DElement('table', row, {className: 'ModalButtons'});

    o.appendChild(new DElement('div', { className: 'Modal' }, body, buttons));
}

extend(DElement, Modal);

Modal.prototype.open = function () {
    var o = this;
    o.saveKeyHandler = document.documentElement.onkeydown;
    document.documentElement.onkeydown = null;
    base.appendChild(o);
};

Modal.prototype.close = function () {
    var o = this;
    base.removeChild(o);
    document.documentElement.onkeydown = o.saveKeyHandler;
};

// What's the division of labor between this and Modal?
// Who is responsible for keyboard handling?
function modal(contents, params) {
    params = params || {};
    if (params.ok === undefined) {   // but null makes it explicitly disabled.
        params.ok = function () {};
    }

    mparams = Object.assign({}, params);
    if (params.ok) {
        mparams.ok = function () { m.close(); params.ok(); };
    }
    if (params.cancel) {
        mparams.cancel = function () { m.close(); params.cancel(); };
    }

    var m = new Modal(contents, mparams);
    m.open();
}
