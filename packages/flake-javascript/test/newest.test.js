async function main() {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(null);
		}, 500)
	})
}
var result = "Hello";

beforeAll: (() => {
	result = "nice"
})();

(async () => {
	// @every These tests are for basic arithmetic operations
	// @group main
	$: "42" == 42
	$: 400 == 20**2
	$: await main() === null
	$: `${result} World!` != "Hello World!"
	// Check whether result is equal to "nice", this should be true since it changes to "nice" before each test.
	$_group: result === "nice"
})()