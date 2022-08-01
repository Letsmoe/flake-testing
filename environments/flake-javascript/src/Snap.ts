import { output, scope } from "./shared.js";
import { getTime } from "./time.js";
import { getLine } from "./Utils.js"

/**
 * Takes a snapshot of the given variable and tracks it's definition all of the execution time.
 * @date 7/13/2022 - 10:36:53 PM
 * @export
 * @param {string} name
 * @param {*} value
 */
export function snap(name: string, value: any = undefined) {
	const takeSnapshot = (value: any, line: number) => {
		scope[name] = value;
		output["snapshots"].push({
			time: getTime(),
			event: {
				type: "reassign",
				line: line - 1,
				name: name,
				value: value,
				from: 0,
				to: 0
			},
			context: {},
			scope: Object.assign({}, scope)
		})
	}

	let glob = typeof window !== "undefined" ? window : global;

	Object.defineProperty(glob, name, {
		get: function () {
			return value;
		},
		set: function (v) {
			value = v;
			let line = getLine();
			takeSnapshot(value, line);
		},
	});
	return glob[name]
}