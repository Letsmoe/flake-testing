function main() {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(42)
		}, 500	)
	})
}

let result = 42;

main().then(function(value) {
	$: value == 42;
})
// @every We're testing the "main" function which returns 42 when called.

var x = 5

$: result === 42
$: result > 41
$: typeof result === "number"
$: result < 41