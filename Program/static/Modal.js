function Modal(contents, params) {
    var o = this;
    Modal.sup.constructor.call(o, 'div', {className: 'ModalBackground'});
    var body = new DElement('div', { className: 'ModalBody' }, contents);
    var saveKeyHandler = document.documentElement.onkeydown;
    document.documentElement.onkeydown = null;
    b = new Button('OK', {
        onclick: function () {
            document.documentElement.onkeydown = saveKeyHandler;
            params.ok();
        }
    });
    var buttons = new DElement('table', tr(td(b)), {className: 'ModalButtons'});

    o.appendChild(new DElement('div', { className: 'Modal' }, body, buttons));
}

extend(DElement, Modal);

// What's the division of labor between this and Modal?
// Who is responsible for keyboard handling?
function modal(contents) {
    var m = new Modal(contents, { ok: function () {base.removeChild(m);}});
    base.appendChild(m);
}
