function Modal(contents, params) {
    var o = this;
    Modal.sup.constructor.call(o, 'div', {className: 'ModalBackground'});
    o.contents = new DElement('div', { className: 'Modal' });
    o.contents.appendChild(contents);
    o.appendChild(o.contents);
    b = new Button('OK', {
        onclick: function () { params.ok(); }
    });
    var buttons = new DElement('div', b, {className: 'ModalButtons'});
    o.appendChild(buttons);
}

extend(DElement, Modal);

// What's the division of labor between this and Modal?
// Who is responsible for keyboard handling?
function modal(contents) {
    var m = new Modal(contents, { ok: function () {base.removeChild(m);}});
    base.appendChild(m);
}
