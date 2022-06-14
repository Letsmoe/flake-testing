import { ResultPipe } from "../class.ResultPipe";
import { OutputObject } from "../types";
import supportsColor from "supports-color";
import * as input from "wait-console-input";
import * as fs from "fs";

const Reset = "\x1b[0m"

interface ColorObject {
	yellow: (message: string) => string;
	red: (message: string) => string;
	green: (message: string) => string;
	blue: (message: string) => string;
	lightblue: (message: string) => string;
	black: (message: string) => string;
	lightgreen: (message: string) => string;
	underline: (message: string) => string;
	bold: (message: string) => string;
	bg: ColorObject;
	rgb: ([r,g,b]: number[]) => (message: string, settings: {skipReset: boolean}) => string;
	default: ([r,g,b]: number[]) => (message: string, settings: {skipReset: boolean}) => string;
}

const colorsTrueColor = {
	yellow: [255, 209, 102],
	green: [130, 158, 46],
	red: [224, 0, 90],
	blue: [33, 145, 251],
	lightblue: [155, 206, 253],
	black: [35, 32, 32],
	lightgreen: [218, 232, 176],
	underline: [4],
	bold: [1],
}

const colors256 = {
	yellow: "33",
	green: "32",
	red: "31",
	blue: "34",
	lightblue: "36",
	black: "30",
	lightgreen: "92",
	underline: "4",
	bold: "1",
	bg: {
		yellow: "43",
		green: "42",
		red: "41",
		blue: "44",
		lightblue: "46",
		black: "40",
		lightgreen: "102",
	}
}

const color = (color: string) => (message: string, settings = {skipReset: false}) => `\x1b[${color}m${message}${settings.skipReset ? "" : Reset}`;

const handler: ProxyHandler<ColorObject> = {}
handler.get = (target: ColorObject, prop: string) => {
	// Check if the console supports truecolor
	if (supportsColor.stdout) {
		// Check if the property is a color
		if (prop === "bg") {
			return new Proxy({
				rgb: ([r,g,b]) => (message: string, settings = {skipReset: false}) => `\x1b[48;2;${r};${g};${b}m${message}${settings.skipReset ? "" : Reset}`
			} as ColorObject, handler)
		}

		if (colorsTrueColor[prop]) {
			if (colorsTrueColor[prop].length === 3) {
				return target.rgb(colorsTrueColor[prop]);
			} else {
				return color(colorsTrueColor[prop][0]);
			}
		}
	} else {
		// Check if the property is a color
		if (colors256[prop]) {
			return colors256[prop];
		}
	}
}

const c = new Proxy({
	rgb: ([r,g,b]) => (message: string, settings = {skipReset: false}) => `\x1b[38;2;${r};${g};${b}m${message}${settings.skipReset ? "" : Reset}`
} as unknown as ColorObject, handler)

class ResultPrinter {
	private pipe: ResultPipe;
	private result: OutputObject;
	constructor(pipe: ResultPipe) {
		this.pipe = pipe;
		pipe.attach((eventName, filePath) => {
			console.log(`${eventName}: ${filePath}`);
		})
	}

	private formatResultInfo() {
		let numAssertions = this.result.result.assertions.length;
		let [groups, numGroups] = [this.result.result.groups, Object.keys(this.result.result.groups).length];

		// Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
		let groupMap = {};
		for (const group of Object.keys(groups)) {
			for (const assertion of groups[group]) {
				groupMap[assertion] = group;
			}
		}
		let groupResults: {[key:string]: {failed: number, total: number}} = {}

		let arrAssertions = this.result.result.assertions;
		let [failed, succeeded] = arrAssertions.reduce((acc, curr) => {
			if (groupMap[curr.name]) {
				if (!groupResults[groupMap[curr.name]]) {
					groupResults[groupMap[curr.name]] = {
						failed: 0,
						total: 0
					}
				}
				if (!curr.result) {
					groupResults[groupMap[curr.name]].failed++;
				}
				groupResults[groupMap[curr.name]].total++;
			}

			if (curr.result === true) {
				return [acc[0], acc[1] + 1]
			} else {
				return [acc[0] + 1, acc[1]]
			}
		}, [0, 0])

		let ratio = (succeeded / numAssertions * 100);

		let info: Array<[string, number | string]> = [
			[c.yellow("Groups"), numGroups],
			[c.yellow("Assertions"), numAssertions],
			[c.yellow("Failed"), failed],
			[c.yellow("Succeeded"), succeeded],
			[c.yellow("Snapshots"), this.result.snapshots.length],
			[c.yellow("Time"), `${this.result.endTime - this.result.startTime}ms`],
			[c.yellow("Ratio"), ratio > 50 ? c.bg.green(`${ratio.toFixed(1)}%`) : c.bg.red(`${ratio.toFixed(1)}%`)],
		]

		let maxKeyLength = info.reduce((acc, curr) => {
			return Math.max(acc, curr[0].length)
		}, 0)

		let output = info.map(curr => {
			let key = curr[0];
			let value = curr[1];
			let padding = maxKeyLength - key.length;
			return `${key}${new Array(padding + 1).join(" ")}: ${value}`
		}).join("\n") + "\n"

		for (const name in groupResults) {
			let result = groupResults[name];
			if (result.failed === result.total) {
				output += `\n${c.yellow(`${c.blue(name)}`)}: ${c.red(`Failed ${result.failed}/${result.total}`)}`
			} else {
				output += `\n${c.blue(name)}: Failed ${result.failed}/${result.total}`
			}
		}

		return output;
	}

	private formatHeader() {
		return "Running flake version 0.0.1;"
	}

	public print(identifier: string) {
		let channel = this.pipe.getChannel(identifier);
		
		if (channel) {
			let result = channel.asJSON();
			this.result = result;
			this.printMain();
		}
	}

	private printMain() {
		console.clear();
		console.log(this.formatHeader());
		console.log(this.formatAssertions());
		console.log(this.formatResultInfo());
		console.log()
		
		this.showOptionsList("main")
	}

	private formatSnapshots(r: OutputObject) {
		const TAB = " ".repeat(6);
		const TAB_SM = " ".repeat(3);
		let snapshots = r.snapshots;
		let startTime = r.startTime;
		let endTime = r.endTime;
		// Loop through all the snapshots and list when they were captured as well as on which line they were captured.
		let i = 0;
		for (const snapshot of snapshots) {
			let relativeTime = snapshot.time - startTime;
			console.log(`${c.yellow(`Snapshot (${i})`)}:`);
			console.log(`${TAB}${c.yellow("Line")}: ${snapshot.event.line}`);
			console.log(`${TAB}${c.yellow("Name")}: "${snapshot.event.name}"`);
			console.log()

			i++;
		}
		let snapshotNumber: number;

		do {
			snapshotNumber = input.readInteger("> Enter the number of a snapshot to inspect.\n")
		} while (snapshotNumber > snapshots.length - 1 || snapshotNumber < 0)


		let snapshot = snapshots[snapshotNumber];
		let relativeTime = snapshot.time - startTime;
		console.clear();
		// Dump the entire scope
		console.log(`${c.bg.green("Scope")}:`);
		for (const key in snapshot.scope) {
			let value = snapshot.scope[key];
			console.log(`${TAB}${c.yellow(key)}: ${JSON.stringify(value)}`);
		}

		console.log()
		// Print information about the assignment that has taken place there.
		console.log(`${c.yellow(`Snapshot (${snapshotNumber})`)}:`);
		console.log(`${TAB}${c.yellow("Time Recorded")}: ${relativeTime}ms after start.`);
		console.log(`${TAB}${c.yellow("Line")}: ${snapshot.event.line}`);
		console.log(`${TAB}${c.yellow("Assignment Type")}: ${snapshot.event.type}`);
		console.log(`${TAB}${c.yellow("Name")}: "${snapshot.event.name}"`);
		console.log(`${TAB}${c.yellow("Value")}: ${JSON.stringify(snapshot.event.value)}`);

		// Print the contextual lines of the file.
		let line = snapshot.event.line;
		let output = "";
		let lines = fs.readFileSync(r.inputFile).toString().split("\n");
		let followingLines = lines.slice(line - 5, line + 4);
		for (const [lineNumber, line] of Object.entries(followingLines)) {
			let correctedLine = parseInt(lineNumber, 10) + snapshot.event.line - 5;
			if (correctedLine === snapshot.event.line - 1) {
				output += `${TAB_SM}${c.red(`>> ${correctedLine + 1}|`)}${TAB_SM}${line}\n`
			} else {
				output += `${TAB}${correctedLine + 1}|${TAB_SM}${line}\n`;
			}
		}
		console.log(output)

		this.showOptionsList("");
	}

	showOptionsList(current: string) {
		if (current !== "snapshots") console.log(`> Press ${c.bold("s")} to get a list of all captured snapshots.`)
		if (current !== "main") console.log(`> Press ${c.bold("r")} to return to the main window.`);
		console.log(`> Press ${c.bold("e")} to exit the debugger.`);

		let char = input.readChar();
		if (char === "s") {
			console.clear()
			console.log(this.formatSnapshots(this.result))
		} else if (char === "r") {
			this.printMain();
		} else if (char === "e") {
			process.exit(0);
		}
	}

	formatAssertions(): any {
		let output = "";
		const TAB = " ".repeat(6);
		const TAB_SM = " ".repeat(3);
		// Loop through all the assertions and check if they're in a group.
		// If they are, print the group name and the assertion.
		// If they aren't, print the assertion.
		let file = this.result.inputFile;
		let groups = this.result.result.groups;
		// Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
		let groupMap = {};
		for (const group of Object.keys(groups)) {
			for (const assertion of groups[group]) {
				groupMap[assertion] = group;
			}
		}
		// Store all assertions
		let assertions = Object.values(this.result.result.assertions);

		for (const assertion of assertions) {
			let name = assertion.name;
			// If the assertion passed we want to write a "PASS" sign with green background
			// If the assertion failed we want to write a "FAIL" sign with red background
			let color = assertion.result ? c.bg.green : c.bg.red;
			let sign = assertion.result ? "PASS" : "FAIL";
			// Remove the path of the config from the filepath since we don't want to list literally the whole thing.
			let replacedFile = file.replace(process.cwd(), "");
			output += groupMap[name] ? `${c.blue(groupMap[name])}: ` : "";
			output += color(sign) + " " + `${replacedFile}:${assertion.line}` + "\n";
			output += TAB + assertion.description + "\n";
			output += `${TAB}${c.blue("content")}: ${c.yellow(assertion.content)}\n\n`

			// If the assertion failed, we want to print the line where it failed and the following 5 lines;
			if (!assertion.result) {
				let lines = fs.readFileSync(file).toString().split("\n");
				let followingLines = lines.slice(assertion.line - 3, assertion.line + 4);
				for (const [lineNumber, line] of Object.entries(followingLines)) {
					let correctedLine = parseInt(lineNumber, 10) + assertion.line - 3;

					let strLine = (correctedLine + 1).toString().padStart(2, " ");
					if (correctedLine === assertion.line - 1) {
						output += `${TAB_SM}${c.red(`>> ${strLine}|`)}${TAB_SM}${c.red(line)}\n`
					} else {
						output += `${TAB}${strLine}|${TAB_SM}${line}\n`;
					}
				}
				output += "\n"
			}
		}
		return output
	}
}

export { ResultPrinter }