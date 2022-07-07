

var result = "Hello";
// @every These tests are for basic arithmetic operations
$: "42" == 42
$: 400 == 20**2
$: 400 - 50 == 350
$: `${result} World!` != "Hello World!"