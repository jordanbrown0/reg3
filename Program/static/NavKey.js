function NavKey()
{
    var o = this;
    document.documentElement.onkeydown = function (e) {
        Debug.keyboard('keydown', e.key);
        // if (isRPCActive()) {
            // // For now, this is interesting enough to always log it.
            // log('ignore because of pending RPC');
            // e.preventDefault();
            // return;
        // }
        o.onkeydown(e);
    };
    // document.body.onkeypress = function (e) { log('keypress', e.key); o.onkeypress(e); };
    // document.body.onkeyup = function (e) { log('keyup', e.key); o.onkeyup(e); };
}

NavKey.prototype.set = function (a) {
    var o = this;
    o.keyHandlers = {};
    o.add(a);
};

NavKey.prototype.add = function (a) {
    var o = this;
    a.forEach(function (e) {
        if (e.perms && !cfg.permissions.includes(e.perms)) {
            return;
        }

        if (e.key) {
            var kn = e.key.length == 1 ? e.key.toUpperCase() : e.key;
            o.keyHandlers[kn] = e.func;
            // Allow Shift+x in addition to x.
            // NEEDSWORK:  Won't interact properly when kn already includes
            // a modifier, because the "Shift" won't be added in the right
            // place.
            if (kn.indexOf('Shift') < 0) {
                o.keyHandlers['Shift'+kn] = e.func;
            }
        }
    });
};

NavKey.prototype.getKeyHandler = function (e) {
    var o = this;
    var key = o.getKeyName(e);

    Debug.keyboard(e.key + ' => ' + key + ', ' + e.keyCode);
    return (o.keyHandlers[key]);
};

// NEEDSWORK is there a potential problem with using these names?
NavKey.prototype.onkeydown = function (e) {
    var o = this;
    var h = o.getKeyHandler(e)
    if (h) {
        Debug.keyboard('handle keydown', e.key);
        e.preventDefault();
        h(e);
    } else {
        if (o.shouldIgnore(e)) {
            Debug.keyboard('ignore', e.key);
            e.preventDefault();
        }
    }
};

// Not currently used; we capture keyboard commands at keydown time.
NavKey.prototype.onkeypress = function (e) {
    var o = this;
    Debug.keyboard('keypress', e);
    if (o.getKeyHandler(e)) {
        Debug.keyboard('ignore keypress', e.key);
        e.preventDefault();
    }
};

// Not currently used; we capture keyboard commands at keydown time.
NavKey.prototype.onkeyup = function (e) {
    var o = this;
    Debug.keyboard('keyup', e);
    if (o.getKeyHandler(e)) {
        Debug.keyboard('ignore keyup', e.key);
        e.preventDefault();
    }
};

var keyAliases = {
    Esc:    'Escape',
    Up:     'ArrowUp',
    Down:   'ArrowDown'
};

// These are keys that we can't suppress, or at least that I haven't
// figured out how to suppress.
// Windows (OS) + anything
// Alt + Tab, Alt + BackTab
// Alt (selects menu bar)
// CapsLock
// Ctrl + Tab, Ctrl + BackTab
// Alt+F4

// These are keys that are always a problem and should always be
// suppressed.
var alwaysNavKeys = [ 'F3', 'F5', 'F12' ];

// These are modifiers that are a problem except for specific
// whitelisted sequences.
var navModifiers = [ 'Alt', 'Control' ];

// This is a list of keys that are (or might be) a problem when we aren't
// editing text, but that are OK when we are editing.  Note that this is both
// a list of keys to ignore when not editing (e.g. Backspace) and a list of
// keys that would normally be ignored because of modifiers but that are OK
// when editing.
var sometimesNavKeys = [
    'Backspace',
    'ControlBackspace',
    'ControlDelete',
    '/',
    '\'',
    'ControlY',
    'ControlA',
    'ControlZ',
    'ControlX',
    'ControlC',
    'ControlV',
    'ControlArrowLeft',
    'ControlArrowRight',
    'ControlArrowUp',
    'ControlArrowDown',
    'ControlHome',
    'ControlEnd'
];

// Which types of <input> involve editing text?
// This is not a complete list, but it's close enough for us.
var inputTypes = [ 'text', 'password', 'date' ];

// Return true if a key event is one that we want to ignore.
NavKey.prototype.shouldIgnore = function (e) {
    var o = this;
    var kn = o.getKeyName(e);
    
    var NO=-1, MAYBE=0, YES=1;
    var ignore = NO;

    if (navModifiers.some(e.getModifierState, e)) {
        ignore = YES;
    }

    if (alwaysNavKeys.includes(kn)) {
        ignore = YES;
    }
    if (sometimesNavKeys.includes(kn)) {
        ignore = MAYBE;
    }

    if (ignore != MAYBE) {
        return (ignore == YES);
    }
    
    // Now comes the hard part.  We need to suppress the rest, *unless*
    // we're in a text editing field.  But note:  simply being in an input
    // isn't enough, because checkboxes and radio buttons don't eat these
    // keys.  Even being in an input-text isn't enough, because
    // read-only and disabled fields don't eat them.
    var t = e.target;
    if (t.readOnly || t.disabled) {
        return (true);
    }
    if (!t.tagName) {
        return (true);
    }
    switch (t.tagName.toLowerCase()) {
    case 'input':
        return (!inputTypes.includes(t.attributes.type.value.toLowerCase()));

    case 'textarea':
        return (false);

    default:
        return (true);
    }
};

NavKey.prototype.getKeyName = function (e) {
    var kn = keyAliases[e.key] || e.key;

    // Map all letters to upper case, but leave names like Enter
    // in mixed case.
    if (kn.length == 1) {
        kn = kn.toUpperCase();
    }

    // Alphabetical order
    var mods = [ 'Alt', 'Control', 'OS', 'Shift' ];
    
    // Don't add modifiers to modifiers.
    if (mods.includes(kn)) {
        return (kn);
    }

    mods.reverse().forEach(function (m) {
        if (e.getModifierState(m)) {
            kn = m + kn;
        }
    });

    return (kn);
};
