import { OutputObject, ImportObject, AssertionObject } from "@flake-testing/core"
import { ResultPipe } from "@flake-testing/core"
import { ResultPrinter } from "@flake-testing/core";

const TEST_FILE = process.cwd() + "/test/output.test.js";
const output: OutputObject = {
	inputFile: process.cwd() + "/test/test.test.js",
	testFile: TEST_FILE,
	identifier: "test",
	status: true,
	result: {
		groups: {},
		assertions: {}
	},
	imports: [],
	snapshots: [],
	time: 0
};

class Scope {
	private properties : {};
	constructor(initial: {} = {}) {
		this.properties = initial;
	}
	set(name: string, value: any) {
		this.properties[name] = value;
	}

	get(name: string) {
		return this.properties[name];
	}

	getAll() {
		return Object.assign({}, this.properties);
	}
}

const currentScope = new Scope();

function receiveVariableAssignment(name: string, value: any, {line, from, to, type}) {
	currentScope.set(name, value);
	output.snapshots.push({
		time: Date.now(),
		event: {
			type: type,
			line,
			from,
			to,
			name,
			value: value
		},
		scope: currentScope.getAll()
	})
	return value
}

function receiveAssertion({name, line, from, to, description, content, result}) {
	output.result.assertions[name] = {
		line,
		from: from,
		to: to,
		description: description.join(" "),
		content,
		// Check if the result is truthy
		result: !(!result)
	}
}

function receiveNamedGroups(groups: {[key: string]: number[]}) {
	output.result.groups = groups;
}

const actions = {}

function actionRegisterReceiver(name: string, callback: Function) {
	if (!actions[name]) actions[name] = [];
	actions[name].push(callback)
}

function receiveCount(count: number) {
	expectCount = count;
}
var expectCount = 0;

function receiveModuleImport(importStatement: ImportObject) {
	output.imports.push(importStatement);
}

function getResults() {
	return new Promise<OutputObject>((resolve, reject) => {
		let start = Date.now();
		import(TEST_FILE).then(module => {
			// The test function is inside the modules default export
			// Execute the modules default export function.
			let count = 0;
			module.default(({line, from, to, content, description, name, result}) => {
				receiveAssertion({line, from, to, content, description, name, result});
				count++
				if (count === expectCount) {
					actions["afterAll"]?.forEach(action => action());
					output.status = Object.values(output.result.assertions).every((x: AssertionObject) => x.result);
					output.startTime = start;
					output.endTime = Date.now();
					resolve(output);
				}
			}, receiveNamedGroups, receiveCount, receiveModuleImport, actionRegisterReceiver, receiveVariableAssignment)
		})
	})
}

getResults().then(out => {
	let pipe = new ResultPipe();
	pipe.ready = () => {
		let printer = new ResultPrinter(pipe)

		let id = pipe.open();
		out.identifier = id;
		pipe.write(id, out);

		printer.print(id);
	}
})