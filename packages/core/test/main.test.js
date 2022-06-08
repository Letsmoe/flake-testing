import {
	describe,
	it,
	expect
} from "@flake-testing/javascript";

function main() {
	return "";
}

describe("main function", () => {
	it("should return a string", () => {
		expect(typeof main()).toBe("string");
	});
})