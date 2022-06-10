import { ResultPipe } from "../class.ResultPipe";
import { OutputObject } from "../types";
import * as input from "wait-console-input";
import * as fs from "fs";

const Reset = "\x1b[0m"
const Bright = "\x1b[1m"
const Dim = "\x1b[2m"
const Underscore = "\x1b[4m"
const Blink = "\x1b[5m"
const Reverse = "\x1b[7m"
const Hidden = "\x1b[8m"
const FgBlack = "\x1b[30m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgMagenta = "\x1b[35m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"
const BgBlack = "\x1b[40m"
const BgRed = "\x1b[41m"
const BgGreen = "\x1b[42m"
const BgYellow = "\x1b[43m"
const BgBlue = "\x1b[44m"
const BgMagenta = "\x1b[45m"
const BgCyan = "\x1b[46m"
const BgWhite = "\x1b[47m"

class c {
	public static yellow = (m: string) => FgYellow + m + Reset;
	public static red = (m: string) => FgRed + m + Reset;
	public static green = (m: string) => FgGreen + m + Reset;
	public static blue = (m: string) => FgBlue + m + Reset;
	public static magenta = (m: string) => FgMagenta + m + Reset;
	public static cyan = (m: string) => FgCyan + m + Reset;
	public static white = (m: string) => FgWhite + m + Reset;
	public static black = (m: string) => FgBlack + m + Reset;
	public static bold = (m: string) => Bright + m + Reset;
	public static dim = (m: string) => Dim + m + Reset;
	public static underscore = (m: string) => Underscore + m + Reset;
	public static blink = (m: string) => Blink + m + Reset;
	public static reverse = (m: string) => Reverse + m + Reset;
	public static hidden = (m: string) => Hidden + m + Reset;
	public static bgGreen = (m: string) => BgGreen + m + Reset;
	public static bgRed = (m: string) => BgRed + m + Reset;
}

class ResultPrinter {
	private pipe: ResultPipe;
	constructor(pipe: ResultPipe) {
		this.pipe = pipe;
		pipe.attach((eventName, filePath) => {
			console.log(`${eventName}: ${filePath}`);
		})
	}

	private formatResultInfo(r: OutputObject) {
		let numAssertions = Object.keys(r.result.assertions).length;
		let [groups, numGroups] = [r.result.groups, Object.keys(r.result.groups).length];

		let arrAssertions = Object.values(r.result.assertions);
		let [failed, succeeded] = arrAssertions.reduce((acc, curr) => {
			if (curr.result === true) {
				return [acc[0], acc[1] + 1]
			} else {
				return [acc[0] + 1, acc[1]]
			}
		}, [0, 0])

		let info: Array<[string, number]> = [
			[c.yellow("Groups"), numGroups],
			[c.yellow("Assertions"), numAssertions],
			[c.red("Failed"), failed],
			[c.green("Succeeded"), succeeded],
			[c.yellow("Snapshots"), r.snapshots.length],
			[c.yellow("Time"), `${r.endTime - r.startTime}ms`]
		]

		let maxKeyLength = info.reduce((acc, curr) => {
			return Math.max(acc, curr[0].length)
		}, 0)

		return info.map(curr => {
			let key = curr[0];
			let value = curr[1];
			let padding = maxKeyLength - key.length;
			return `${key}${new Array(padding + 1).join(" ")}: ${value}`
		}).join("\n")
	}

	private formatHeader() {
		return "Running flake version 0.0.1;"
	}

	public print(identifier: string) {
		let channel = this.pipe.getChannel(identifier);
		
		if (channel) {
			let result = channel.asJSON();

			console.log(this.formatHeader());
			console.log(this.formatAssertions(result, channel));
			console.log(this.formatResultInfo(result));
			console.log()
			let char = input.readChar(`> Press ${c.bold("s")} to get a list of all captured snapshots.\n`);
			if (char === "s") {
				console.clear()
				console.log(this.formatSnapshots(result))
			}
		}
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
			console.log(`${TAB}${c.yellow("Time Recorded")}: ${relativeTime}ms after start.`);
			console.log(`${TAB}${c.yellow("Line")}: ${snapshot.event.line}`);
			console.log(`${TAB}${c.yellow("Assignment Type")}: ${snapshot.event.type}`);
			console.log(`${TAB}${c.yellow("Name")}: "${snapshot.event.name}"`);
			console.log()

			i++;
		}
		let snapshotNumber = input.readInteger("> Enter the number of a snapshot to inspect.\n");
		if (snapshotNumber >= 0 && snapshotNumber < snapshots.length) {
			let snapshot = snapshots[snapshotNumber];
			let relativeTime = snapshot.time - startTime;
			console.clear();
			// Dump the entire scope
			console.log(`${c.yellow("Scope")}:`);
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

			let char = input.readChar(`> Press ${c.bold("s")} to get a list of all captured snapshots.\n`);
			if (char === "s") {
				console.clear()
				console.log(this.formatSnapshots(r))
			}
		}
	}

	formatAssertions(r: OutputObject, channel: any): any {
		let output = "";
		const TAB = " ".repeat(6);
		const TAB_SM = " ".repeat(3);
		// Loop through all the assertions and check if they're in a group.
		// If they are, print the group name and the assertion.
		// If they aren't, print the assertion.
		let file = r.inputFile;
		let groups = r.result.groups;
		let assertions = Object.values(r.result.assertions);

		for (const assertion of assertions) {
			// If the assertion passed we want to write a "PASS" sign with green background
			// If the assertion failed we want to write a "FAIL" sign with red background
			let color = assertion.result ? c.bgGreen : c.bgRed;
			let sign = assertion.result ? "PASS" : "FAIL";
			output += color(sign) + " " + `${file}:${assertion.line}` + "\n";
			output += "     " + assertion.description + "\n";

			// If the assertion failed, we want to print the line where it failed and the following 5 lines;
			if (!assertion.result) {
				output += "\n"
				let lines = fs.readFileSync(file).toString().split("\n");
				let followingLines = lines.slice(assertion.line - 5, assertion.line + 4);
				for (const [lineNumber, line] of Object.entries(followingLines)) {
					let correctedLine = parseInt(lineNumber, 10) + assertion.line - 5;
					if (correctedLine === assertion.line - 1) {
						output += `${TAB_SM}${c.red(`>> ${correctedLine + 1}|`)}${TAB_SM}${line}\n`
					} else {
						output += `${TAB}${correctedLine + 1}|${TAB_SM}${line}\n`;
					}
				}
				output += "\n"
			}
		}
		return output
	}
}

export { ResultPrinter }