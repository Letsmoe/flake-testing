import { AssertionObject, SpecifierObject } from "@flake-universal/core";
import { FlakeConfigObject } from "@flake-universal/core/dist/config/config.type";

class Scope {
	private properties: {};
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

function InitTestEnvironment(callback: Function, config: FlakeConfigObject) {
	let start = Date.now();
	// How many tests we expect before returning results.
	let expectCount = 0;
	// How many tests were already run
	let count = 0;
	// An array of actions to perform at a certain point in time.
	let actions = {};
	// The object to output results in.
	const output = {
		inputFile: "",
		testFile: "",
		identifier: "",
		status: true,
		result: {
			groups: {},
			assertions: [],
		},
		imports: [],
		snapshots: [],
		startTime: 0,
		endTime: 0,
	};

	const currentScope = new Scope();


	function NamedGroupsReceiver(groups: { [key: string]: number[] }) {
		output.result.groups = groups;
	}

	function CountReceiver(x: number) {
		expectCount = x;
	}

	function ModuleImportReceiver(specifiers: SpecifierObject[], source: string, from: number, to: number, line: number) {
		output.imports.push({
			line,
			from,
			to,
			source,
			specifiers
		})
	}

	function ActionReceiver(name: string, callback: Function, line: number, start: number, end: number) {
		if (name === "snap") {
			// We don't want an action but to push the result into the scope.
			currentScope.set("snap", callback)
			output.snapshots.push({
				time: Date.now(),
				event: {
					type: "snapshot",
					line: line,
					from: start,
					to: end,
					name: "snapshot",
					value: callback
				},
				scope: currentScope.getAll(),
				context: {}
			})
			return
		}

		if (!actions[name]) actions[name] = [];
		actions[name].push(callback);
	}

	function AssertionReceiver({
		name,
		line,
		from,
		to,
		description,
		content,
		result,
	}) {
		output.result.assertions.push({
			line,
			name,
			from: from,
			to: to,
			description: description.join(" "),
			content,
			// Check if the result is truthy or - if strictCompare is set to true - if it is "true".
			result: config.strictCompare ? result === true : !!result,
			context: {}
		});
	}

	function VariableAssignmentReceiver(
		name: string,
		value: any,
		{ line, from, to, type }
	) {
		currentScope.set(name, value);
		output.snapshots.push({
			time: Date.now(),
			event: {
				type: type,
				line,
				from,
				to,
				name,
				value: value,
			},
			scope: currentScope.getAll(),
			context: {}
		});
		return value;
	}

	return [
		({
			line,
			from,
			to,
			content,
			description,
			name,
			result,
		}) => {
			AssertionReceiver({
				line,
				from,
				to,
				content,
				description,
				name,
				result,
			});
			count++;
			if (count === expectCount) {
				actions["afterAll"]?.forEach((action: Function) =>
					action()
				);
				// Check if all results are true, meaning they completed successfully.
				output.status = output.result.assertions.every(
					(x: AssertionObject) => x.result
				);
				output.startTime = start;
				output.endTime = Date.now();
				callback(output);
			}
		},
		NamedGroupsReceiver,
		CountReceiver,
		ModuleImportReceiver,
		ActionReceiver,
		VariableAssignmentReceiver
	]
}

export { InitTestEnvironment }