import { OutputObject, ImportObject, AssertionObject, FileExecutor } from "@flake-testing/core"
import { ResultPipe } from "@flake-testing/core"
import { ResultPrinter } from "@flake-testing/core";
import { RewriteJavaScriptFileContent } from "./rewriteFiles";

const TEST_FILE = process.cwd() + "/test/output.test.js";
const output: OutputObject = {
	inputFile: process.cwd() + "/test/main.test.js",
	testFile: TEST_FILE,
	identifier: "test",
	status: true,
	result: {
		groups: {},
		assertions: []
	},
	imports: [],
	snapshots: [],
	startTime: 0,
	endTime: 0
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
	output.result.assertions.push({
		line,
		name,
		from: from,
		to: to,
		description: description.join(" "),
		content,
		// Check if the result is truthy
		result: !(!result)
	})
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

function getResults(file: string, options: {}, callback: Function) {
	let start = Date.now();
	import(file).then(module => {
		// The test function is inside the modules default export
		// Execute the modules default export function.
		let count = 0;
		module.default(({line, from, to, content, description, name, result}) => {
			receiveAssertion({line, from, to, content, description, name, result});
			count++
			if (count === expectCount) {
				actions["afterAll"]?.forEach(action => action());
				output.status = output.result.assertions.every((x: AssertionObject) => x.result);
				output.startTime = start;
				output.endTime = Date.now();
				callback(output);
			}
		}, receiveNamedGroups, receiveCount, receiveModuleImport, actionRegisterReceiver, receiveVariableAssignment)
	})
}

/**
 * We want to pass the rewrite function and the executor to an instance of the default FileExecutor class.
 * The result of the rewritten JS will be stored in a temporary file which will then be passed to the executor function.
 * This function returns a promise when it is executed asynchronously, the output must follow the schema for structured data and the result will then be written to disk.
 */

const executor = new FileExecutor(RewriteJavaScriptFileContent, getResults);
const pipe = new ResultPipe();

pipe.ready = () => {
	executor.collectFiles(/.*\.(?:test|spec)\.(?:tsx|jsx|ts|js)/, pipe.getConfig())
	let printer = new ResultPrinter(pipe)

	let id = pipe.open();
	out.identifier = id;
	pipe.write(id, out);

	printer.print(id);
}