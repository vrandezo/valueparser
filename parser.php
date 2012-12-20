<?php
$input = $_GET['val'];
$type = $_GET['datatype'];
$unit = $_GET['unit'];
$upper = $_GET['upper'];
$lower = $_GET['lower'];
$autocertainty = $_GET['autocertainty'];

$result = '';
$error = '';

if ($type == "string") {
	$result = parseString($input);
} else if ($type == "number") {
	list($result, $error) = parseNumber($input, $unit, $autocertainty, $upper, $lower);
} else if ($type == "geo") {
	$result = parseGeo($input);
} else if ($type == "time") {
	$result = parseTime($input);
} else {
	$result = '"unknown datatype"';
}
$answer = '{ "result" : ' . $result . ', '
   . '"input" : "' . $input . '", '
   . '"datatype" : "' . $type . '", '
   . '"timestamp" : "' . date("c") . '" ';
if ($error != '') { $answer .= ', "error" : "' . $error . '"'; }
$answer .= '}';
echo $answer;

function parseNumber($x, $unit, $autocertainty, $upper, $lower) {
	$error = '';
	list($number, $rest, $sigfig, $order) = readNumber($x);

	if (in_array($rest, array('ft', 'feet', "'", 'foot'))) {
		$unit = 'feet';
	} else if (in_array($rest, array('yd', 'yard', 'yards'))) {
		$unit = 'yard';
	} else if (in_array($rest, array('m', 'meter', 'metre', 'meters', 'metres'))) {
		$unit = 'meter';
	} else if (in_array($rest, array('km', 'kilometer', 'kilometre', 'kilometres', 'kilometers'))) {
		$unit = 'km';
	} else if (in_array($rest, array('mile', 'miles', 'mi'))) {
		$unit = 'miles';
	} else if (in_array($rest, array('cm', 'centimeter', 'centimetre', 'centimeters', 'centimetres'))) {
		$unit = 'cm';
	} else if (in_array($rest, array("''", 'inch', 'inches'))) {
		$unit = 'inch';
	} else {
		$error .= "  unrecognized unit designation  ";
	}

	if ($autocertainty=='true') $upper = $lower = pow(10, $order-$sigfig+1);
	
	$otherunit = 'other';
	$othernumber = 0;
	$otherupper = 0;
	$otherlower = 0;
	if ($unit == 'meter') {
		$otherunit = 'feet';
		$factor = 3.280839895;
	} else if ($unit == 'feet') {	
		$otherunit = 'meter';
		$factor = 0.3048;
	} else if ($unit == 'yard') {
		$otherunit = 'meter';
		$factor = 0.9144;
	} else if ($unit == 'km') {
		$otherunit = 'miles';
		$factor = 0.621371192;
	} else if ($unit == 'miles') {
		$otherunit = 'km';
		$factor = 1.609344;
	} else if ($unit == 'cm') {
		$otherunit = 'inch';
		$factor = 0.3937;
	} else if ($unit == 'inch') {
		$otherunit = 'cm';
		$factor = 2.54;
	}
	$o = convertUnitSoft($number, $upper, $lower, $factor);
	$exactnumber = $o[0];
	$exactupper = $o[1];
	$exactlower = $o[2];
	$o = convertUnitHard($number, $upper, $lower, $sigfig, $factor);
	$othernumber = $o[0];
	$otherupper = $o[1];
	$otherlower = $o[2];

		
	$confidence = "0.683";
	$result = '{ '
	        . '"quantityvalue" : "' . $number . '", '
	        . '"upperuncertainty" : "' . $upper . '", '
	        . '"loweruncertainty" : "' . $lower . '", '
	        . '"confidence" : "' . $confidence . '", '
	        . '"unit" : "' . $unit . '", '
	        . '"otherunit" : { '
	        . '"quantityvalue" : "' . $othernumber . '", '
	        . '"upperuncertainty" : "' . $otherupper . '", '
	        . '"loweruncertainty" : "' . $otherlower . '", '
	        . '"unit" : "' . $otherunit . '" '
	        . '}, '
	        . '"exactconversion" : { '
	        . '"quantityvalue" : "' . $exactnumber . '", '
	        . '"upperuncertainty" : "' . $exactupper . '", '
	        . '"loweruncertainty" : "' . $exactlower . '", '
	        . '"unit" : "' . $otherunit . '" '
	        . '}}';
	return array($result, $error);
};

function parseString($input) {
	$result = $input;
	return '"' . $result . '"';
};

function parseGeo($input) {
	$result = '"on earth, maybe"';
	return $result;
};

function parseTime($input) {
	$result = date("c", strtotime($input));
	return $result;
};

function convertUnitSoft($number, $upper, $lower, $factor) {
	$othernumber = $number * $factor;
	$otherupper = $upper * $factor;
	$otherlower = $lower * $factor;
	return array($othernumber, $otherupper, $otherlower);
};

function convertUnitHard($number, $upper, $lower, $sigfig, $factor) {
	$othernumber = roundSigFig($number*$factor, $sigfig);
	$roundedDigits = ceil(log($othernumber, 10)) - $sigfig;
	$minUncertainty = pow(10, $roundedDigits);
	$otherupper = max(roundSigFig($upper*$factor, 1), $minUncertainty);
	$otherlower = max(roundSigFig($lower*$factor, 1), $minUncertainty);
	return array($othernumber, $otherupper, $otherlower);
};

function roundSigFig($number, $sigfig) {
	if ($number == 0) return 0;
	
	$order = -1*floor(log($number, 10));
	$number = round($number*pow(10, $order), $sigfig-1);
	return $number / pow(10, $order);	
};

//echo "\n" . roundSigFig(12345000, 3) . "\n";

function readNumber($x) {
	$number = 0;
	$order = 0;
	$dot = false;
	$sigfig = 0;
	$postdot = 0;
	$rest = '';
	for ($i=0; $i < strlen($x); $i++) {
		$c = $x[$i];
		if (is_numeric($c)) {
			$number *= 10;
			$number += intval($c);
			$sigfig++;
			if ($dot) $postdot++;
		} else if (($c==',') or ($c==' ')) {
		} else if ($c=='.') {
			$dot = true;
		} else {
			$rest = substr($x, $i);
			break;
		}
	}
	$number = $number / pow(10, $postdot);
	// get the number of significant digits
	if ($number==0) {
		$sigfig = 1;
	} else if ($postdot==0) {
		// for numbers without a dot, remove one sigfig for every 0 at the right edge
		$n = $number;
		while ($n % 10 == 0) {
			$sigfig--;
			$n /= 10; 
		}
	} else {
		// for numbers with a dot, remove one sigfig for every 0 at the left edge
		$n = $number;
		while ($n < 1) {
			$sigfig--;
			$n *= 10;
		}
	}
	// get the position of the first digit
	if ($number == 0) { $order = 0; } else {
		$order = floor(log($number, 10));
	}
	return array($number, $rest, $sigfig, $order);
};

parseNumber('22', 'meter', true, '1', '1');
//list($number, $rest, $sigfig, $order) = readNumber('123000 m');
//echo "\n$number $rest $sigfig $order\n";