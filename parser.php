<?php
$input = $_GET["val"];
$type = $_GET["datatype"];

$result = "d";
if ($type == "string") {
	$result = parseString($input);
} else if ($type == "number") {
	$result = parseNumber($input);
} else if ($type == "geo") {
	$result = parseGeo($input);
} else if ($type == "time") {
	$result = parseTime($input);
} else {
	$result = "unknown datatype";
}
echo '{ "result" : "' . $result . '", "input" : "' . $input . '", "datatype" : "' . $type . '", "timestamp" : "' . date("c") . '" }';

function parseNumber($x) {
	$result = floatval($x);
	return $result;
};

function parseString($input) {
	$result = $input;
	return $result;
};

function parseGeo($input) {
	$result = "on earth, maybe";
	return $result;
};

function parseTime($input) {
	$result = date("c", strtotime($input));
	return $result;
};

