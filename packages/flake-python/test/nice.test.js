function main() {
	return 42;
}

var result = main();

afterAll: () => {
	result++;
}

for (let i = 0; i < 5; i++) {
	$: result == (42 + i)
}