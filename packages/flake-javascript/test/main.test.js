function main() {
	return 42;
}

let result = main()
// @every We're testing the "main" function which returns 42 when called.

$: result === 42
$: result > 43
$: typeof result === "number"