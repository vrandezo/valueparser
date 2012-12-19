<?php
$input = $_GET["val"];
$type = $_GET["datatype"];
$unit = $_GET["unit"];

$result = "d";
$error = '';

if ($type == "string") {
	$result = parseString($input);
} else if ($type == "number") {
	$r = parseNumber($input, $unit);
	$result = $r[0];
	$error = $r[1];
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

function parseNumber($x, $unit) {
	$error = '';
	$pieces = explode(' ', $x);
	$number = floatval($x);
	if (count($pieces) > 2) {
		$error .= "  too many whitespaces  ";
	} else if (count($pieces) == 2) {
		$number = floatval($pieces[0]);
		if (($pieces[1] == "ft") or ($pieces[1] == "feet") or ($pieces[1] == "'")) {
			$unit = "feet";
		} else if (($pieces[1] == "yd") or ($pieces[1] == "yard")) {
			$unit = "yard";
		} else if (($pieces[1] == "meter") or ($pieces[1] == "metre") or ($pieces[1] == "m")) {
			$unit = "meter";
		} else {
			$error .= "  unrecognized unit designation  ";
		}
	} else if (count($pieces) == 1) {
	} else if (count($pieces) == 0) {
	}
	$upper = 0;
	$lower = 0;
	
	$otherunit = 'other';
	$othernumber = 0;
	$otherupper = 0;
	$otherlower = 0;
	if ($unit == 'meter') {
		$otherunit = 'feet';
		$o = transformUnit($number, $upper, $lower, 3.280839895);
		$othernumber = $o[0];
		$otherupper = $o[1];
		$otherlower = $o[2];
	} else if ($unit == 'feet') {	
		$otherunit = 'meter';
		$o = transformUnit($number, $upper, $lower, 0.3048);
		$othernumber = $o[0];
		$otherupper = $o[1];
		$otherlower = $o[2];
	} else if ($unit == 'yard') {
		$otherunit = 'meter';
		$o = transformUnit($number, $upper, $lower, 0.9144);
		$othernumber = $o[0];
		$otherupper = $o[1];
		$otherlower = $o[2];
	}
		
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

function transformUnit($number, $upper, $lower, $factor) {
	$othernumber = $number * $factor;
	$otherupper = $upper * $factor;
	$otherlower = $lower * $factor;
	return array($othernumber, $otherupper, $otherlower);
};