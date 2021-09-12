// A Date/Time object in local time.  Using Date would be better, but we don't
// trust the local time zone and so it would be error-prone to keep times in
// UTC.
//
// The object can be incomplete.  It may contain a date, a time, neither, or
// both.  The primary cases are date and date+time; the others are for
// intermediate results.
//
// Note:  hours, minutes, and seconds are plural because the Date methods are
// getHours et cetera.  If we need to flip a coin, we might as well use the
// same coin flip they did.
function LDate(year, month, day, hours, minutes, seconds) {
    var o = this;
    assert(arguments.length == 0
        || arguments.length == 3
        || arguments.length == 6,
        'LDate constructor requires no arguments, or y,m,d, or y,m,d,h,m,s');
    if (arguments.length > 0) {
        o.year = year;
        o.month = month;
        o.day = day;
    }
    if (arguments.length > 3) {
        o.hours = hours;
        o.minutes = minutes;
        o.seconds = seconds;
    }
}

// Given a date in our storage format (ISO 8601 local time), return an LDate.
LDate.fromJSON = function (value) {
    if (!value) {
        return (new LDate());
    }

    if (value.indexOf('T') < 0) {
        // ECMAScript specifies that date-only strings are interpreted
        // as UTC, while date+time strings without time zone specifiers
        // are interpreted as local time.  We want to force local time.
        value += 'T00:00';
        var d = new Date(value);
        return (new LDate(d.getFullYear(), d.getMonth()+1, d.getDate()));
    }
    var dt = new Date(value);
    return (new LDate(dt.getFullYear(), dt.getMonth()+1, dt.getDate(),
        dt.getHours(), dt.getMinutes(), dt.getSeconds()));
};

LDate.prototype.toJSONDate = function () {
    var o = this;
    if (!'year' in o) {
        return (null);
    }
    return (
        o.year.toString().padStart(4, '0')
        + '-'
        + o.month.toString().padStart(2, '0')
        + '-'
        + o.day.toString().padStart(2, '0')
    );
};

LDate.prototype.toJSONTime = function () {
    var o = this;
    if (!('hours' in o)) {
        return (null);
    }
    return (
        o.hours.toString().padStart(2, '0')
        + ':'
        + o.minutes.toString().padStart(2, '0')
        + ':'
        + o.seconds.toString().padStart(2, '0')
    );
};

// Given an LDate, return a date in our storage format (ISO 8601 local time).
// Return null if the LDate is empty.
LDate.prototype.toJSON = function () {
    var o = this;
    var d = o.toJSONDate();
    var t = o.toJSONTime();
    var ret = '';
    if (d) {
        ret += d;
    }
    if (t) {
        ret += 'T' + t;
    }
    return (ret);
};

// Given a time in our editable format (hh:mm[:ss]), return an incomplete
// LDate.  Note that although seconds are optional on input, the resulting
// object always includes a seconds member.
//
// Throw a TimeParseError on error.
LDate.fromEditableTime = function (s) {
    if (!s) {
        return (null);
    }

    var hms = s.split(':');
    if (hms.length < 2 || hms.length > 3) {
        throw (new TimeParseError('Invalid time'));
    }
    var hours = parseInt(hms[0], 10);
    var minutes = parseInt(hms[1], 10);
    var seconds = 0;
    if (hms.length > 2) {
        seconds = parseInt(hms[2], 10);
    }
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)
        || hours < 0 || hours > 23
        || minutes < 0 || minutes > 59
        || seconds < 0 || seconds > 59) {
        throw (new TimeParseError('Invalid time'));
    }
    var ld = new LDate();
    ld.hours = hours;
    ld.minutes = minutes;
    ld.seconds = seconds;
    return (ld);
}

// Given a date in our input format (mm/dd/[yy]yy), return an LDate.
// Two-digit dates default to 20xx.
// On empty input string, returns null.
// On parse error, throws a DateParseError.
LDate.fromEditableDate = function (s) {
    if (!s) {
        return (null);
    }
    var mmddyy = s.split('/');
    if (mmddyy.length != 3) {
        throw (new DateParseError('Invalid date'));
    }
    var month = parseInt(mmddyy[0], 10);
    var day = parseInt(mmddyy[1], 10);
    var year = parseInt(mmddyy[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
        throw (new DateParseError('Invalid date'));
    }
    if (year < 100) {
        year += 2000;
    }

    // Normalize, to validate.
    var d = new Date(year, month-1, day);
    var month2 = d.getMonth()+1;
    var day2 = d.getDate();
    var year2 = d.getFullYear();
    if (month != month2 || day != day2 || year != year2) {
        throw (new DateParseError('Invalid date'));
    }
    return (new LDate(year, month, day));
}

// Given a date and optional time in our input format
// mm/dd/[yy]yy [hh:mm[:ss]]
// return an LDate.
// Return null for an empty string.
// Throw a DateTimeParseError on error.  Note that it might be a
// DateParseError, a TimeParseError, or a natural DateTimeParseError.
// NEEDSWORK Currently this always returns a time in the object.  Should it
// return a date-only object if no time was specified?
LDate.fromEditable = function (s) {
    if (!s) {
        return (null);
    }

    var dt = s.split(' ');
    if (dt.length < 1 || dt.length > 2) {
        throw (new DateTimeParseError('Invalid date+time'));
    }
    var ld = LDate.fromEditableDate(dt[0]);
    if (dt.length == 1) {
        ld.hours = 0;
        ld.minutes = 0;
        ld.seconds = 0;
    } else {
        var t = LDate.fromEditableTime(dt[1]);
        ld.hours = t.hours;
        ld.minutes = t.minutes;
        ld.seconds = t.seconds;
    }
    return (ld);
};

// Given an LDate, return a date in our editable form (mm/dd/yyyy).
// If the LDate does not contain a date, return an empty string.
LDate.prototype.toEditableDate = function (opts) {
    var o = this;
    if (!('year' in o)) {
        return ('');
    }

    return (
        o.month.toString().padStart(2, '0')
        + '/'
        + o.day.toString().padStart(2, '0')
        + '/'
        + o.year.toString().padStart(4, '0')
    );
};

// Given an LDate, return a time in our editable form (hh:mm[:ss]).
// Return the empty string if the LDate does not include a time.
LDate.prototype.toEditableTime = function (opts) {
    var o = this;
    opts = opts || {};

    if (!('hours' in o)) {
        return ('');
    }

    var ret =
        o.hours.toString().padStart(2, '0')
        + ':'
        + o.minutes.toString().padStart(2, '0');
    if (opts.seconds) {
        ret +=
            ':'
            + o.seconds.toString().padStart(2, '0');
    }
    return (ret);
};

// Given an LDate, return a string in our editable form (mm/dd/yyyy hh:mm[:ss]).
// If the LDate is empty, return the empty string.
// NEEDSWORK:  this will produce hh:mm[:ss] if the LDate does not include a
// date.  LDate.fromEditable doesn't handle that case.  Should it be an error
// here, or should LDate.fromEditable handle it?
LDate.prototype.toEditable = function (opts) {
    var o = this;
    return (joinTruthy([o.toEditableDate(opts), o.toEditableTime(opts)], ' '));
};

// Given an LDate, return the date portion as a string in display form.
// If the LDate does not include a date portion, return the empty string.
LDate.prototype.toDisplayDate = function (opts) {
    var o = this;
    opts = opts || {};

    if (!('year' in o)) {
        return ('');
    }
    var d = new Date(o.year, o.month-1, o.day)
    return (d.toDateString());
};

// Given an LDate, return the time portion as a string in display form.
// If the LDate does not include a time portion, return the empty string.
// NEEDSWORK configuration option for 24-hour time.
LDate.prototype.toDisplayTime = function (opts) {
    var o = this;
    opts = opts || {};

    if (!('hours' in o)) {
        return ('');
    }

    var hh = o.hours;
    var ampm = hh < 12 ? 'AM' : 'PM';
    hh %= 12;
    if (hh == 0) {
        hh = 12;
    }
    var ts = hh.toString();
    ts += ':' + o.minutes.toString().padStart(2, '0');
    if (opts.seconds) {
        ts += ':' + o.seconds.toString().padStart(2, '0');
    }
    ts += ' ' + ampm;
    return (ts);
};

// Given an LDate, return it in display form.  Note that both date and time
// are optional; an empty LDate will result in an empty string.
LDate.prototype.toDisplay = function (opts) {
    var o = this;
    opts = opts || {};

    return (joinTruthy([o.toDisplayDate(opts), o.toDisplayTime(opts)], ' '));
}

function DateTimeParseError(msg) {
    var o = this;
    DateTimeParseError.sup.constructor.call(o, msg);
}

extend(MyError, DateTimeParseError);

DateTimeParseError.prototype.name = 'DateTimeParseError';


function DateParseError(msg) {
    var o = this;
    DateParseError.sup.constructor.call(o, msg);
}

extend(DateTimeParseError, DateParseError);

DateParseError.prototype.name = 'DateParseError';

function TimeParseError(msg) {
    var o = this;
    TimeParseError.sup.constructor.call(o, msg);
}

extend(DateTimeParseError, TimeParseError);

TimeParseError.prototype.name = 'TimeParseError';

