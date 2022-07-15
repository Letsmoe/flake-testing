import { afterEach, beforeEach, snap, assert } from "flake-javascript";

function main() {
	return 42;
}

snap("result")

result = main();

afterEach(() => {
	result++;
})

for (let i = 0; i < 5; i++) {
	assert(result == (42 + i))
}