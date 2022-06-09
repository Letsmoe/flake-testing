import * as fs from 'fs';

const TEST_FILE = process.cwd() + "/test/output.test.js";

type SpecifierObject = {
	name: string;
	local: string;
	default: boolean;
}
type ImportObject = { source: string; specifiers: SpecifierObject[] };

function assertionReceiver(name: string, line: number, description: string[], content: string, result: any) {
	//console.log(`${name} ${line} ${description.join(" ")}`);
	//console.log(content);
	//console.log(result);
	if (!result) {
		console.error(`${name} ${line} ${description.join(" ")}`);
		let file = fs.readFileSync(process.cwd() + "/test/test.test.js", "utf8").toString();

		// Print the line where the error occurred as well as the next 4 lines.
		console.log(file.split("\n").slice(line - 2, line + 4).map((x, i) => i === 1 ? ">>  " + x : "    " + x).join("\n"));
	}
}

function namedGroupReceiver(groups: {[key: string]: number[]}) {
	//console.log(groups);
}

const actions = {}

function actionRegisterReceiver(name: string, callback: Function) {
	//console.log(`Registering action ${name}`);
	if (!actions[name]) actions[name] = [];
	actions[name].push(callback)
}

function countReceiver(count: number) {
	//console.log(`${count} assertions`);
	expectCount = count;
}
var expectCount = 0;

function moduleImportReceiver(importStatement: ImportObject) {
	//console.log(importStatement);
}

function getResults() {
	return new Promise<void>((resolve, reject) => {
		import(TEST_FILE).then(module => {
			// The test function is inside the modules default export
			// Execute the modules default export function.
			let count = 0;
			module.default((...args: any[]) => {
				assertionReceiver(...args);
				count++
				if (count === expectCount) {
					actions["afterAll"]?.forEach(action => action());
					resolve();
				}
			}, namedGroupReceiver, countReceiver, moduleImportReceiver, actionRegisterReceiver)
		})
	})
}

import(TEST_FILE).then(module => {
	const code = module.default;

	getResults().then(results => {
		console.log(results);
	})
})