function main() {
	return 42;
}

afterAll:() => {
	console.log(result);
}

let result = main()
const x = 5;
var y = {
	nice: true
}
// @every This is a test for the "main" function above, it should return true and therefore pass the test.
// @group main
$:
	typeof result === "string"
$:
	result == 42