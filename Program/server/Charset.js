// It is really rude that Buffer.toString() et al do not allow for
// plug-in encodings.  It's tempting to polyfill this on top of
// Buffer.toString(), but I guess not.

const { assert } = require('./utils');

var XXX = '';
var win1252_to_JS = [
    XXX, XXX, XXX, XXX, XXX, XXX, XXX, XXX,
    XXX, XXX, XXX, XXX, XXX, XXX, XXX, XXX,
    XXX, XXX, XXX, XXX, XXX, XXX, XXX, XXX,
    XXX, XXX, XXX, XXX, XXX, XXX, XXX, XXX,
    ' ', '!', '"', '#', '$', '%', '&', '\'',
    '(', ')', '*', '+', ',', '-', '.', '/',
    '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', ':', ';', '<', '=', '>', '?',
    '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
    'X', 'Y', 'Z', '[', '\\',']', '^', '_',
    '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', '{', '|', '}', '~', XXX,
    '€', XXX, '‚', 'ƒ', '„', '…', '†', '‡',
    'ˆ', '‰', 'Š', '‹', 'Œ', XXX, 'Ž', XXX,
    XXX, '‘', '’', '“', '”', '•', '–', '—',
'\u02dc','™', 'š', '›', 'œ', XXX, 'ž', 'Ÿ',
    ' ', '¡', '¢', '£', '¤', '¥', '¦', '§',
    '¨', '©', 'ª', '«', '¬', XXX, '®', '¯',
    '°', '±', '²', '³', '´', 'µ', '¶', '·',
    '¸', '¹', 'º', '»', '¼', '½', '¾', '¿',
    'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç',
    'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï',
    'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', '×',
    'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß',
    'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç',
    'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï',
    'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', '÷',
    'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ', 'ÿ'
];
assert(win1252_to_JS.length == 256, 'bad Windows 1252 table');

var decoders = { 'win-1252': win1252_to_JS };

var Charset = {};

Charset.decode = function(buf, encoding, start, end) {
    let table = decoders[encoding];
    if (!table) {
        return (buf.toString(encoding, start, end));
    }

    if (start == undefined) {
        start = 0;
    }
    if (end == undefined) {
        end = buf.length;
    }
    let s = '';
    for (let i = start; i < end; i++) {
        s += table[buf[i]];
    }
    return (s);
};

module.exports = exports = Charset;
