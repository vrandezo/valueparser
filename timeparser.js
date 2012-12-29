(function( window ) {

var timeparser = {};
var _oldTimeParser = window.timeparser;
window.timeparser = timeparser;

timeparser.noConflict = function() {
	window.timeparser = _oldTimeParser;
	return timeparser;
};

timeparser.settings = {};
timeparser.settings.bce = ['BCE', 'BC', 'B.C.'];
timeparser.settings.ace = ['CE', 'AD', 'A.D.'];
timeparser.settings.pasttext = '% ago';
timeparser.settings.futuretext = 'in %';
timeparser.settings.calendarnames = [];
timeparser.settings.calendarnames[0] = ['Gregorian', 'G', 'GD', 'GC', 'NS', 'N.S.']
timeparser.settings.calendarnames[1] = ['Julian', 'J', 'JD', 'JC', 'OS', 'G.S.']
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
		data.gyear = data.year;
		data.gmonth = data.month;
		data.gday = data.day;
		data.calendar = 'http://wikidata.org/id/Q12138';
	} else if (data.calendarname === 'Julian') {
		var result = julianToGregorian(data.year, data.month, data.day);
		data.gyear = result.year;
		data.gmonth = result.month;
		data.gday = result.day;
		data.calendar = 'http://wikidata.org/id/Q11184';
	} else {
		data.gyear = null;
		data.gmonth = null;
		data.gday = null;
		data.calendar = 'http://wikidata.org/id/Q12138';
	}
	
	if (data.gyear !== null) {
		data.time = ((data.gyear<0)?'-':'+') + pad(data.gyear, 11) + '-' + pad(data.gmonth, 2)
			 + '-' + pad(data.gday, 2) + 'T' + pad(data.hour, 2) + ':' + pad(data.minute, 2)
			 + ':' + pad(data.second, 2) + 'Z';
	}

	data.text = getTextFromDate(data);
	
	return data;
};
timeparser.parse = parse;

var julianToJulianDay = function(year, month, day) {
	// based on en.wikipedia.org/wiki/Julian_day_number
	var a = Math.floor((14-month)/12);
	var y = year + 4800 - a;
	var m = month + 12 * a - 3;
	return day + Math.floor((153*m + 2)/5) + 365*y + Math.floor(y/4) - 32083;
};
timeparser.julianToJulianDay = julianToJulianDay;

var julianDayToGregorian = function(jdn) {
	// based on en.wikipedia.org/wiki/Julian_day_number
	var result = {};
	var j = jdn + 32044;
	var g = Math.floor(j / 146097);
	var dg = j % 146097;
	var c = Math.floor(((Math.floor(dg / 36524) + 1) * 3) / 4);
	var dc = dg - c*36524;
	var b = Math.floor(dc / 1461);
	var db = dc % 1461;
	var a = Math.floor((Math.floor(db/365) + 1)*3 / 4);
	var da = db - a*365;
	var y = g*400 + c*100 + b*4 + a;
	var m = Math.floor((da*5 + 308) / 153) - 2;
	var d = da - Math.floor(((m+4)*153)/5) + 122;
	result.year = y - 4800 + Math.floor((m + 2) / 12);
	result.month = ((m+2) % 12) + 1;
	result.day = d + 1;
	return result;
};
timeparser.julianDayToGregorian = julianDayToGregorian;

var julianToGregorian = function(year, month, day) {
	var julianday = julianToJulianDay(year, month, day);
	return julianDayToGregorian(julianday);
};
timeparser.julianToGregorian = julianToGregorian;

var readAsYear = function(word) {
	var year = parseInt(word);
	if (isNaN(year)) return null;
	return year;
};

var readAsMonth = function(word) {
	var month = parseInt(word);
	if (isNaN(month)) {
		for(var i=0; i<timeparser.settings.monthnames.length; i++) {
			for(var j=0; j<timeparser.settings.monthnames[i].length; j++) {
				if (timeparser.settings.monthnames[i][j].toLowerCase() === word.toLowerCase()) {
					return i+1;
				}
			}
		}
	} else {
		if ((month > 0) && (month < 13)) {
			return month;
		}
	}
	return null;
};

var readAsDay = function(word) {
	var day = parseInt(word);
	if (isNaN(day)) return null;
	if ((day > 0) && (day < 32)) {
		return day;
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

var tokenize = function(s) {
	var result = [];
	var token = '';
	var tokenisnumber = false;
	for (var i = 0; i < s.length; i++) {
		if (/[\s,]/.test(s[i])) {
			if (token === '') continue;
			result.push(token);
			token = '';
			continue;
		}
		if (tokenisnumber && !/\d/.test(s[i])) {
			if (token!=='') result.push(token);
			token = '';
		}
		token += s[i];
		tokenisnumber = /\d+/.test(token);
	}
	if (token !== '') result.push(token);
	return result;
};
timeparser.tokenize = tokenize;

var getDateFromText = function(data) {
	var year = null;
	var month = null;
	var day = null;
	var bce = null;
	var calendar = null;
	
	var words = tokenize(data.input);
	
	if (words.length === 1) {
		var year0 = readAsYear(words[0]);

		if (year0 !== null) {
			year = year0;
		}
	} else if (words.length === 2) {
		var month0 = readAsMonth(words[0]);
		var year0 = readAsYear(words[0]);
		var year1 = readAsYear(words[1]);
		var bce1 = readAsBCE(words[1]);
		
		if ((month0 !== null) && (year1 !== null)) {
			month = month0;
			year = year1;
		} else if ((year0 !== null) && (bce1 !== null)) {
			bce = bce1;
			year = year0;
		}
	} else if (words.length === 3) {
		var bce2 = readAsBCE(words[2]);
		var year1 = readAsYear(words[1]);
		var year2 = readAsYear(words[2]);
		var month0 = readAsMonth(words[0]);
		var month1 = readAsMonth(words[1]);
		var day0 = readAsDay(words[0]);
		var day1 = readAsDay(words[1]);
		
		if ((month0 !== null) && (year1 !== null) && (bce2 !== null)) {
			month = month0;
			year = year1;
			bce = bce2;
		} else if ((month0 !== null) && (day1 !== null) && (year2 !== null)) {
			day = day1;
			month = month0;
			year = year2;
		} else if ((day0 !== null) && (month1 !== null) && (year2 !== null)) {
			day = day0;
			month = month1;
			year = year2;
		}
	} else if (words.length === 4) {
		var calendar3 = readAsCalendar(words[3]);
		var bce3 = readAsBCE(words[3]);
		var year2 = readAsYear(words[2]);
		var month0 = readAsMonth(words[0]);
		var month1 = readAsMonth(words[1]);
		var day0 = readAsDay(words[0]);
		var day1 = readAsDay(words[1]);

		if ((month0 !== null) && (day1 !== null) && (year2 !== null) && (bce3 !== null)) {
			day = day1;
			month = month0;
			year = year2;
			bce = bce3;
		} else if ((day0 !== null) && (month1 !== null) && (year2 !== null) && (bce3 !== null)) {
			day = day0;
			month = month1;
			year = year2;
			bce = bce3;
		} else if ((month0 !== null) && (day1 !== null) && (year2 !== null) && (calendar3 !== null)) {
			day = day1;
			month = month0;
			year = year2;
			calendar = calendar3;
		} else if ((day0 !== null) && (month1 !== null) && (year2 !== null) && (calendar3 !== null)) {
			day = day0;
			month = month1;
			year = year2;
			calendar = calendar3;
		}
	} else if (words.length === 5) {
		var calendar4 = readAsCalendar(words[4]);
		var bce3 = readAsBCE(words[3]);
		var year2 = readAsYear(words[2]);
		var month0 = readAsMonth(words[0]);
		var month1 = readAsMonth(words[1]);
		var day0 = readAsDay(words[0]);
		var day1 = readAsDay(words[1]);

		if ((month0 !== null) && (day1 !== null) && (year2 !== null) && (bce3 !== null) && (calendar4 !== null)) {
			day = day1;
			month = month0;
			year = year2;
			bce = bce3;
			calendar = calendar4;
		} else if ((day0 !== null) && (month1 !== null) && (year2 !== null) && (bce3 !== null) && (calendar4 !== null)) {
			day = day0;
			month = month1;
			year = year2;
			bce = bce3;
			calendar = calendar4;
		}
	}
		
	if (bce !== null) {
		if (year < 1) return;
		data.bce = bce;
		if (bce) year = -1*(year - 1);
	}
	if (year !== null) {
		data.year = year;
		if (year < 1) data.bce = true;
		data.precision.internal = 9;
	}
	if (month !== null) {
		data.month = month;
		data.precision.internal = 10;
	}
	if (day !== null) {
		data.day = day;
		data.precision.internal = 11;
	}
	if (calendar !== null) {
		data.calendarname = calendar;
	} else if (year < 1583) {
		data.calendarname = 'Julian';
	} else {
		data.calendarname = 'Gregorian';
	}
};

var writeApproximateYear = function(data) {
	var p = data.precision.internal;
	var significant = Math.floor(Math.abs(data.year)/Math.pow(10, 9-p));
	if (p<8) significant++;
	var text = timeparser.settings.outputprecision[p].replace('%', significant);
	if (p < 6) {
		if (data.bce) {
			text = timeparser.settings.pasttext.replace('%', text);
		} else {
			text = timeparser.settings.futuretext.replace('%', text);
		}
	} else {
		if (data.bce) {
			text += ' ' + timeparser.settings.bce[0];
		}
	}
	return text;
};

var writeYear = function(data) {
	if (data.bce) {
		return -1*(data.year-1) + ' ' + timeparser.settings.bce[0];
	} 
	if (data.year === 0) {
		return '1 ' + timeparser.settings.bce[0];
	} 
	return data.year;
};

var writeMonth = function(data) {
	return timeparser.settings.monthnames[data.month-1][0] + ' ' + writeYear(data);
};

var writeDay = function(data) {
	return timeparser.settings.monthnames[data.month-1][0] + ' ' + data.day + ', ' + writeYear(data);
};

var getTextFromDate = function(data) {
	var retval = '';
	if (data.year === null) return '';
	if (data.precision.internal < 9) return writeApproximateYear(data);
	switch (data.precision.internal) {
		case  9 : return writeYear(data);
		case 10 : return writeMonth(data);
		case 11 : return writeDay(data);
		default : return writeDay(data) + '  (time not implemented yet)';
	}
};

var precisionText = function( acc ) {
	if ((acc > timeparser.settings.maxPrecision) || (acc < 0)) return undefined;
	return timeparser.settings.precisiontexts[acc];
};
timeparser.precisionText = precisionText;
})(window);
