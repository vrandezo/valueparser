(function( window ) {

var timeparser = {};
var _oldTimeParser = window.timeparser;
window.timeparser = timeparser;

timeparser.noConflict = function() {
	window.timeparser = _oldTimeParser;
	return timeparser;
};

timeparser.settings = {};
timeparser.settings.bce = ['BCE', 'BC', 'B.C.', 'before Common Era', 'before Christ'];
timeparser.settings.ace = ['CE', 'AD', 'A.D.', 'Anno Domini', 'Common Era'];
timeparser.settings.pasttext = '% ago';
timeparser.settings.futuretext = 'in %';
timeparser.settings.calendarnames = [];
timeparser.settings.calendarnames[0] = ['Gregorian', 'G', 'GD', 'GC', 'NS', 'N.S.', 'New Style', 'Gregorian calendar', 'Gregorian date'];
timeparser.settings.calendarnames[1] = ['Julian', 'J', 'JD', 'JC', 'OS', 'O.S.', 'Old Style', 'Julian calendar', 'Julian date'];
timeparser.settings.monthnames = [];
timeparser.settings.monthnames[0]  = ['January', 'Jan'];
timeparser.settings.monthnames[1]  = ['February', 'Feb'];
timeparser.settings.monthnames[2]  = ['March', 'Mar'];
timeparser.settings.monthnames[3]  = ['April', 'Apr'];
timeparser.settings.monthnames[4]  = ['May'];
timeparser.settings.monthnames[5]  = ['June', 'Jun'];
timeparser.settings.monthnames[6]  = ['July', 'Jul'],
timeparser.settings.monthnames[7]  = ['August', 'Aug'];
timeparser.settings.monthnames[8]  = ['September', 'Sep'];
timeparser.settings.monthnames[9]  = ['October', 'Oct'];
timeparser.settings.monthnames[10] = ['November', 'Nov'];
timeparser.settings.monthnames[11] = ['December', 'Dec'];
timeparser.settings.precisiontexts = {};
timeparser.settings.precisiontexts[0]  = 'billion years';
timeparser.settings.precisiontexts[1]  = 'hundred million years';
timeparser.settings.precisiontexts[2]  = 'ten million years';
timeparser.settings.precisiontexts[3]  = 'million years';
timeparser.settings.precisiontexts[4]  = '100,000 years';
timeparser.settings.precisiontexts[5]  = '10,000 years';
timeparser.settings.precisiontexts[6]  = 'millenium';
timeparser.settings.precisiontexts[7]  = 'century';
timeparser.settings.precisiontexts[8]  = 'decade';
timeparser.settings.precisiontexts[9]  = 'year';
timeparser.settings.precisiontexts[10] = 'month';
timeparser.settings.precisiontexts[11] = 'day';
timeparser.settings.precisiontexts[12] = 'hour';
timeparser.settings.precisiontexts[13] = 'minute';
timeparser.settings.precisiontexts[14] = 'second';
timeparser.settings.outputprecision = {};
timeparser.settings.outputprecision[0] = '% billion years';
timeparser.settings.outputprecision[1] = '%00 million years';
timeparser.settings.outputprecision[2] = '%0 million years';
timeparser.settings.outputprecision[3] = '% million years';
timeparser.settings.outputprecision[4] = '%00,000 years';
timeparser.settings.outputprecision[5] = '%0,000 years';
timeparser.settings.outputprecision[6] = '%. millenium';
timeparser.settings.outputprecision[7] = '%. century';
timeparser.settings.outputprecision[8] = '%0s';

timeparser.maxPrecision =  14;

var pad = function(number,digits) { return (1e12 + Math.abs(number) + '').slice(-digits); }

var parse = function( text, precision ) {
	var data = {};
	data.input = text;
	
	data.bce = false;
	data.year = null;
	data.month = 1;
	data.day = 1;
	data.hour = 0;
	data.minute = 0;
	data.second = 0;
	data.precision = {};
	
	getDateFromText(data);

	if (precision !== undefined) {
		data.precision.internal = precision;
	}

	data.precision.text = precisionText( data.precision.internal );
	data.precision.before = 0;
	data.precision.after = 0;
	
	data.utcoffset = '+00:00';

	if (data.calendarname === 'Gregorian') {
		var result = gregorianToJulian(data.year, data.month, data.day);
		data.jyear = result.year;
		data.jmonth = result.month;
		data.jday = result.day;
		data.gyear = data.year;
		data.gmonth = data.month;
		data.gday = data.day;
		data.calendar = 'http://wikidata.org/id/Q1985727';
		data.jdn = gregorianToJulianDay(data.year, data.month, data.day);
	} else if (data.calendarname === 'Julian') {
		var result = julianToGregorian(data.year, data.month, data.day);
		data.jyear = data.year;
		data.jmonth = data.month;
		data.jday = data.day;
		data.gyear = result.year;
		data.gmonth = result.month;
		data.gday = result.day;
		data.calendar = 'http://wikidata.org/id/Q1985786';
		data.jdn = julianToJulianDay(data.year, data.month, data.day);
	} else {
		data.jyear = null;
		data.jmonth = null;
		data.jday = null;
		data.gyear = null;
		data.gmonth = null;
		data.gday = null;
		data.calendar = null;
	}
	
	if (data.gyear !== null) {
		data.time = ((data.gyear<0)?'-':'+') + pad(data.gyear, 11) + '-' + pad(data.gmonth, 2)
			 + '-' + pad(data.gday, 2) + 'T' + pad(data.hour, 2) + ':' + pad(data.minute, 2)
			 + ':' + pad(data.second, 2) + 'Z';
	}

	data.text = getTextFromDate(data.precision.internal, data.year, data.month, data.day);
	data.gtext = getTextFromDate(data.precision.internal, data.gyear, data.gmonth, data.gday);
	data.jtext = getTextFromDate(data.precision.internal, data.jyear, data.jmonth, data.jday);
	
	return data;
};

var julianToJulianDay = function(year, month, day) {
	// based on en.wikipedia.org/wiki/Julian_day_number
	var a = Math.floor((14-month)/12);
	var y = year + 4800 - a;
	var m = month + 12 * a - 3;
	return day + Math.floor((153*m + 2)/5) + 365*y + Math.floor(y/4) - 32083;
};

var gregorianToJulianDay = function(year, month, day) {
	// based on en.wikipedia.org/wiki/Julian_day_number
	var a = Math.floor((14-month)/12);
	var y = year + 4800 - a;
	var m = month + 12 * a - 3;
	return day + Math.floor((153*m + 2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
};

var julianDayToJulian = function(jdn) {
	// based on http://www.tondering.dk/claus/cal/julperiod.php
	var result = {};
	var b = 0;
	var c = jdn + 32082;
	
	var d = Math.floor((4*c + 3) / 1461);
	var e = c - Math.floor((1461*d)/4);
	var m = Math.floor((5*e + 2) / 153);

	result.year = 100*b + d - 4800 + Math.floor(m/10);
	result.month = m + 3 - 12*Math.floor(m/10);
	result.day = e - Math.floor((153*m + 2) / 5) + 1;
	return result;
};

var julianDayToGregorian = function(jdn) {
	// based on http://www.tondering.dk/claus/cal/julperiod.php
	var result = {};
	var a = jdn + 32044;
	var b = Math.floor((4*a + 3) / 146097);
	var c = a - Math.floor((146097*b)/4);
	
	var d = Math.floor((4*c + 3) / 1461);
	var e = c - Math.floor((1461*d)/4);
	var m = Math.floor((5*e + 2) / 153);

	result.year = 100*b + d - 4800 + Math.floor(m/10);
	result.month = m + 3 - 12*Math.floor(m/10);
	result.day = e - Math.floor((153*m + 2) / 5) + 1;
	return result;
};

var julianToGregorian = function(year, month, day) {
	var julianday = julianToJulianDay(year, month, day);
	return julianDayToGregorian(julianday);
};

var gregorianToJulian = function(year, month, day) {
	var julianday = gregorianToJulianDay(year, month, day);
	return julianDayToJulian(julianday);
};

var readAsMonth = function(word) {
	for(var i=0; i<timeparser.settings.monthnames.length; i++) {
		for(var j=0; j<timeparser.settings.monthnames[i].length; j++) {
			if (timeparser.settings.monthnames[i][j].toLowerCase() === word.toLowerCase()) {
				return i+1;
			}
		}
	}
	return null;
};

var readAsBCE = function(word) {
	for(var i=0; i<timeparser.settings.bce.length; i++) {
		if (timeparser.settings.bce[i].toLowerCase() === word.toLowerCase()) {
			return true;
		}
	}
	for(var i=0; i<timeparser.settings.ace.length; i++) {
		if (timeparser.settings.ace[i].toLowerCase() === word.toLowerCase()) {
			return false;
		}
	}
	return null;
};

var readAsCalendar = function(word) {
	for (var i=0; i<timeparser.settings.calendarnames.length; i++) {
		for (var j=0; j<timeparser.settings.calendarnames[i].length; j++) {
			if (timeparser.settings.calendarnames[i][j].toLowerCase() === word.toLowerCase()) {
				return timeparser.settings.calendarnames[i][0];
			}
		}
	}
	return null;
};

var testString = function(s) {
	var v = readAsMonth(s);
	if (v !== null) {
		return { 'val' : v, 'type' : 'month', 'month' : true };
	}
	v = readAsBCE(s);
	if (v !== null) {
		return { 'val' : v, 'type' : 'bce' };
	}
	v = readAsCalendar(s);
	if (v !== null) {
		return { 'val' : v, 'type' : 'calendar' };
	}
	return null;
};

var fullMatch = function(str, reg) {
	var matches = reg.exec(str);
	if (matches === null) return false;
	return str === matches[0];
};

var analyze = function(t) {
	if (fullMatch(t, /\d{1,11}/)) {
		var v = parseInt(t);
		var day = (t > 0) && (t < 32);
		var month = (t > 0) && (t < 13);
		var type = 'number';
		if (!day && !month) type = 'year'; 
		return { 'val' : v, 'type' : type, 'month' : month, 'day' : day };
	} else {
		return testString(t);
	}
};

var tokenize = function(s) {
	var result = [];
	var token = '';
	var minus = { 'type' : 'minus', 'val' : '-' };
	for (var i = 0; i < s.length; i++) {
		if (/[\s,\.\/-]/.test(s[i])) {
			if (token === '') {
				if (s[i] === '-') result.push(minus);
				continue;
			}
			var analysis = analyze(token);
			if (analysis !== null) {
				result.push(analysis);
				token = '';
				continue;
			}
			if (s[i] === '-') {
				result.push(analysis);
				result.push(minus);
				token = '';
				continue;
			}
			token += s[i];
			continue;
		}
		if (fullMatch(token, /\d+/) && !/\d/.test(s[i])) {
			if (token!=='') result.push(analyze(token));
			token = '';
		}
		token += s[i];
	}
	if (token !== '') result.push(analyze(token));
	return result;
};

var matchGrammar = function(grammar, tokens) {
	var result = {};
	if (grammar.length !== tokens.length) return null;

	for (var i = 0; i < grammar.length; i++) {
		if (tokens[i] === null) return null;
		if (grammar[i] === 'y') {
			if ((tokens[i].type === 'number') || (tokens[i].type === 'year')) {
				result.year = tokens[i].val;
				continue;
			} else return null;
		}
		if (grammar[i] === 'm') {
			if (((tokens[i].type === 'number') || (tokens[i].type === 'month')) && tokens[i].month) {
				result.month = tokens[i].val;
				continue;
			} else return null;
		}
		if (grammar[i] === 'd') {
			if (((tokens[i].type === 'number') || (tokens[i].type === 'day')) && tokens[i].day) {
				result.day = tokens[i].val;
				continue;
			} else return null;
		}
		if (grammar[i] === 'c') {
			if (tokens[i].type === 'calendar') {
				result.calendar = tokens[i].val;
				continue;
			} else return null;
		}
		if (grammar[i] === 'b') {
			if (tokens[i].type === 'bce') {
				result.bce = tokens[i].val;
				continue;
			} else return null;
		}
		if (grammar[i] === '-') {
			if (tokens[i].type === 'minus') {
				if (grammar[i+1] === 'y') {
					result.minus = true;
				}
				continue;
			} else return null;
		}
		return null;
	}
	return result;
};

var matchGrammars = function(grammars, tokens) {
	var result = null;
	for (var i = 0; i < grammars.length; i++) {
		result = matchGrammar(grammars[i], tokens);
		if (result !== null) return result;
	}
	return null;
};

var getDateFromText = function(data) {
	var tokens = tokenize(data.input);
	var result = matchGrammars([
			'y', '-y', 'my', 'm-y', 'yb', 'myb', 'mdy', 'md-y', 'dmy', 'dm-y',
			'mdyb', 'dmyb', 'mdyc', ',md-yc', 'dmyc', 'dm-yc',
			'mdybc', 'dmybc', 'ymd', '-ymd', 'ym', '-ym'
		], tokens);
	
	if (result === null) return;
	
	if (result.minus !== undefined) {
		result.year = result.year*-1;
	}
	if (result.bce !== undefined) {
		if (result.year < 1) return;
		data.bce = result.bce;
		if (result.bce) result.year = -1*(result.year - 1);
	}
	if (result.year !== undefined) {
		data.year = result.year;
		if (result.year < 1) data.bce = true;
		data.precision.internal = 9;
		var temp = result.year;
		if ((temp < -1500) || (temp > 5000)) {
			while (temp % 10 === 0) {
				temp /= 10;
				data.precision.internal -= 1;
			}
		}
	}
	if (result.month !== undefined) {
		data.month = result.month;
		data.precision.internal = 10;
	}
	if (result.day !== undefined) {
		data.day = result.day;
		data.precision.internal = 11;
	}
	if (result.calendar !== undefined) {
		data.calendarname = result.calendar;
	} else if ((result.year < 1583) && (data.precision.internal > 10)) {
		data.calendarname = 'Julian';
	} else {
		data.calendarname = 'Gregorian';
	}

	return;
};

var writeApproximateYear = function(year, precision) {
	var significant = Math.floor((Math.abs(year)-1)/Math.pow(10, 9-precision))+1;
	var text = timeparser.settings.outputprecision[precision].replace('%', significant);
	if (precision < 6) {
		if (year < 0) {
			text = timeparser.settings.pasttext.replace('%', text);
		} else {
			text = timeparser.settings.futuretext.replace('%', text);
		}
	} else {
		if (year < 1) {
			text += ' ' + timeparser.settings.bce[0];
		}
	}
	return text;
};

var writeYear = function(year) {
	if (year < 0) {
		return -1*(year-1) + ' ' + timeparser.settings.bce[0];
	} 
	if (year === 0) {
		return '1 ' + timeparser.settings.bce[0];
	} 
	return year;
};

var writeMonth = function(year, month) {
	return timeparser.settings.monthnames[month-1][0] + ' ' + writeYear(year);
};

var writeDay = function(year, month, day) {
	return timeparser.settings.monthnames[month-1][0] + ' ' + day + ', ' + writeYear(year);
};

var getTextFromDate = function(precision, year, month, day) {
	var retval = '';
	if (year === null) return '';
	if (precision < 9) return writeApproximateYear(year, precision);
	switch (precision) {
		case  9 : return writeYear(year);
		case 10 : return writeMonth(year, month);
		case 11 : return writeDay(year, month, day);
		default : return writeDay(year, month, day) + '  (time not implemented yet)';
	}
};

var precisionText = function( acc ) {
	if ((acc > timeparser.settings.maxPrecision) || (acc < 0)) return undefined;
	return timeparser.settings.precisiontexts[acc];
};

timeparser.parse = parse;

timeparser.julianToGregorian = julianToGregorian;
timeparser.gregorianToJulian = gregorianToJulian;
timeparser.julianToJulianDay = julianToJulianDay;
timeparser.gregorianToJulianDay = gregorianToJulianDay;
timeparser.julianDayToGregorian = julianDayToGregorian;
timeparser.julianDayToJulian = julianDayToJulian;

timeparser.writeApproximateYear = writeApproximateYear;
timeparser.writeYear = writeYear;
timeparser.writeMonth = writeMonth;
timeparser.writeDay = writeDay;
timeparser.getTextFromDate = getTextFromDate;
timeparser.precisionText = precisionText;

})(window);
