<?php

include "flake";

function main() {
	return 42;
}

$result = main();
global $result;

afterAll(function() {
	$GLOBALS["result"]++;
});

for ($i=0; $i < 5; $i++) { 
	assert($result == (42 + i));
}