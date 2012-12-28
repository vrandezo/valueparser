(function( window ) {

var timeparser = {};
var _oldTimeParser = window.timeparser;
window.timeparser = timeparser;

timeparser.noConflict = function() {
	window.timeparser = _oldTimeParser;
	return timeparser;
};

timeparser.settings = {};
timeparser.settings.bce = ['BCE', 'BC'];
timeparser.settings.ace = ['CE', 'AD'];
timeparser.settings.ago = ['ago'];
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
timeparser.settings.precisiontexts[5]  = 'second';
timeparser.settings.precisiontexts[4]  = 'minute';
timeparser.settings.precisiontexts[3]  = 'hour';
timeparser.settings.precisiontexts[2]  = 'day';
timeparser.settings.precisiontexts[1]  = 'month';
timeparser.settings.precisiontexts[0]  = 'year';
timeparser.settings.precisiontexts[-1] = 'decade';
timeparser.settings.precisiontexts[-2] = 'century';
timeparser.settings.precisiontexts[-3] = 'millenium';
timeparser.settings.precisiontexts[-4] = '10,000 years';
timeparser.settings.precisiontexts[-5] = '100,000 years';
timeparser.settings.precisiontexts[-6] = 'million years';
timeparser.settings.precisiontexts[-7] = 'ten million years';
timeparser.settings.precisiontexts[-8] = 'hundred million years';
timeparser.settings.precisiontexts[-9] = 'billion years';
timeparser.settings.outputprecision = {};
timeparser.settings.outputprecision[-1] = '%0s';
timeparser.settings.outputprecision[-2] = '%. century';
timeparser.settings.outputprecision[-3] = '%. millenium';
timeparser.settings.outputprecision[-4] = '%0,000 years';
timeparser.settings.outputprecision[-5] = '%00,000 years';
timeparser.settings.outputprecision[-6] = '% million years';
timeparser.settings.outputprecision[-7] = '%0 million years';
timeparser.settings.outputprecision[-8] = '%00 million years';
timeparser.settings.outputprecision[-9] = '% billion years';

timeparser.precisionMax =  5;
timeparser.precisionMin = -9;

var pad = function(number,digits) { return (1e12 + Math.abs(number) + '').slice(-digits); }

timeparser.parse = function( text, precision ) {
	var data = {};
	data.input = text;
	
	data.bce = false;
	data.year = null;
	data.month = 1;
	data.day = 1;
	data.hour = 0;
	data.minute = 0;
	data.second = 0;
	
	data.precision = { 'internal' : (precision === undefined) ? 0 : precision };

	getDateFromText(data);

	data.precision.text = timeparser.precisionText( data.precision.internal );
	data.precision.before = 0;
	data.precision.after = 0;
	
	data.utcoffset = '+00:00';
	data.calendar = 'http://wikidata.org/id/Q12138';
	
	data.time = ((data.year<0)?'-':'+') + pad(data.year, 11) + '-' + pad(data.month, 2)
		 + '-' + pad(data.day, 2) + 'T' + pad(data.hour, 2) + ':' + pad(data.minute, 2)
		 + ':' + pad(data.second, 2) + 'Z';

	data.text = getTextFromDate(data);
	
	return data;
};

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

var getDateFromText = function(data) {
	var splits = data.input.split(/[\s.,]+/);
	var words = new Array();
	for (var i = 0; i<splits.length; i++) if (splits[i]!=='') words.push(splits[i]);
	
	if (words.length === 1) {
		var year = readAsYear(words[0]);
		if (year !== null) data.year = year;
		if (year < 1) data.bce = true;
		data.precision.internal = 0;
		return;
	}

	if (words.length === 2) {
		var month0 = readAsMonth(words[0]);
		var year0 = readAsYear(words[0]);
		var year1 = readAsYear(words[1]);
		var bce1 = readAsBCE(words[1]);
		
		if ((month0 !== null) && (year1 !== null)) {
			data.month = month0;
			data.year = year1;
			if (year1 < 1) data.bce = true;
			data.precision.internal = 1;
			return;
		}
		
		if ((year0 !== null) && (bce1 !== null)) {
			if (year0 < 0) return
			if (bce1) {
				if (year0 === 0) return;
				data.bce = true;
				data.year = -1*(year0 - 1);
			} else {
				data.year = year0;
			}
			data.precision.internal = 0;
		}
	}
		
	if (words.length === 3) {
		var month0 = readAsMonth(words[0]);
		var year1 = readAsYear(words[1]);
		var bce2 = readAsBCE(words[2]);
		
		if ((month0 !== null) && (year1 !== null) && (bce2 !== null)) {
			if (year1 < 0) return;
			if (bce2) {
				if (year1 === 0) return;
				data.bce = true;
				data.year = -1*(year1 - 1);
			} else {
				data.year = year1;
			}
			data.month = month0;
			data.precision.internal = 1;
			return;
		}
		
		return;
	}
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
	return timeparser.settings.monthnames[data.month-1][0] + ' ' + data.day + ', ' + data.year;
};

var getTextFromDate = function(data) {
	var retval = '';
	if (data.year === null) return '';
	switch (data.precision.internal) {
		case  0 : return writeYear(data);
		case  1 : return writeMonth(data);
		case  2 : return writeDay(data);
		default : return 'not understood';
	}
};

timeparser.precisionText = function( acc ) {
	if ((acc > 6) || (acc < -9)) return undefined;
	return timeparser.settings.precisiontexts[acc];
};
})(window);
