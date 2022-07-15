import { assert, snap } from "flake-javascript";

async function main() {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			resolve(42)
		}, 500)
	})
}

let result = await main();

assert(result == 42)