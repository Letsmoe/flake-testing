import { OutputObject } from "../types";
import * as fs from "fs";
import {c} from "./color.js";
import boxen from "boxen";
import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { generateRandomString } from "../utils/randomString.js";


class ResultPrinter {
	private headers: {[key: string]: string} = {"0": "Running flake version 0.0.1;"}
	private result: OutputObject[];
	private margin: number;
	// A number to store the current index in, this allows navigating results.
	private currentIndex: number = 0;
	constructor() {}

	private formatResultInfo(obj: OutputObject) {
		let numAssertions = obj.result.assertions.length;
		let [groups, numGroups] = [obj.result.groups, Object.keys(obj.result.groups).length];

		// Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
		let groupMap = {};
		for (const group of Object.keys(groups)) {
			for (const assertion of groups[group]) {
				groupMap[assertion] = group;
			}
		}
		let groupResults: {[key:string]: {failed: number, total: number}} = {}

		let arrAssertions = obj.result.assertions;
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
			[c.yellow("Snapshots"), obj.snapshots.length],
			[c.yellow("Time"), `${obj.endTime - obj.startTime}ms`],
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
		}).join("\n")

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
		return Object.values(this.headers).map(x => {
			return "  " + x.trim()
		}).join("\n")
	}

	public addHeader(message: string): void {
		let id = generateRandomString(16);
		this.headers[id] = message;
	}

	public reserveHeader(message: string): (msg: string) => void {
		let id = generateRandomString(16);
		this.headers[id] = message;
		return (msg: string) => {
			this.headers[id] = msg;
			this.printMain()
		}
	}

	public print(result: OutputObject[]) {
		this.result = result;
		this.printMain();
	}

	private readListeners: readline.Interface[] = [];
	private closeAllListeners() {
		this.readListeners.forEach(listener => {
			listener.close();
		})
	}

	private printMain() {
		this.closeAllListeners();
		let currentResult = this.result[this.currentIndex];
		this.margin = 0.5;
		console.clear();
		console.log(this.formatHeader());
		if (currentResult) {
			let text = "";
			text += this.formatAssertions(currentResult) + "\n";
			text += this.formatResultInfo(currentResult);
			console.log(boxen(text, { title: `Page ${this.currentIndex + 1} of ${this.result.length}`, titleAlignment: "left", padding: {top: 1, left: 1.5, right: 1.5, bottom: 1}, margin: this.margin }))
			this.showOptionsList("main")
		} else {
			console.log("There are no results to display, try running again.")
		}
	}

	private formatSnapshots(obj: OutputObject) {
		console.clear()
		const TAB = " ".repeat(6);
		const TAB_SM = " ".repeat(3);
		let snapshots = obj.snapshots;
		let startTime = obj.startTime;
		let endTime = obj.endTime;
		// Loop through all the snapshots and list when they were captured as well as on which line they were captured.
		let i = 0;
		let text = "";
		for (const snapshot of snapshots) {
			text += `${c.yellow(`Snapshot (${i})`)}:\n`
			text += `${TAB_SM}${c.yellow("Line")}: ${snapshot.event.line}\n`
			text += `${TAB_SM}${c.yellow("Name")}: "${snapshot.event.name}"\n`
			i++;
		}
		console.log(boxen(text, { title: `Page ${this.currentIndex + 1} of ${this.result.length}`, titleAlignment: "left", padding: {top: 1, left: 1.5, right: 1.5, bottom: 1}, margin: this.margin }))

		const [rl, answer] = readString("  What snapshot do you want to inspect:", (str: string) => {
			return parseInt(str, 10) >= 0 && parseInt(str, 10) < snapshots.length;
		})
		this.readListeners.push(rl);
		answer.then(answer => {
			console.clear();
			
			let snapshotNumber = parseInt(answer);
			let snapshot = snapshots[snapshotNumber];
			let relativeTime = snapshot.time - startTime;
			let text = "";
			// Dump the entire scope
			text += `${c.bg.green("Scope")}:\n`
			for (const key in snapshot.scope) {
				let value = snapshot.scope[key];
				text += `${TAB_SM}${c.yellow(key)}: ${JSON.stringify(value)}\n`
			}

			// Print information about the assignment that has taken place there.
			text += `${c.yellow(`Snapshot (${snapshotNumber})`)}:\n`
			text += `${TAB_SM}${c.yellow("Time Recorded")}: ${relativeTime}ms after start.\n`
			text += `${TAB_SM}${c.yellow("Line")}: ${snapshot.event.line}\n`
			text += `${TAB_SM}${c.yellow("Assignment Type")}: ${snapshot.event.type}\n`
			text += `${TAB_SM}${c.yellow("Name")}: "${snapshot.event.name}"\n`
			text += `${TAB_SM}${c.yellow("Value")}: ${JSON.stringify(snapshot.event.value)}\n`

			// Print the contextual lines of the file.
			for (const [lineNumber, line] of Object.entries(snapshot.context)) {
				let correctedLine = parseInt(lineNumber, 10);
				if (correctedLine === snapshot.event.line) {
					text += `${TAB_SM}${c.red(`>> ${correctedLine + 1}|`)}${TAB_SM}${line}\n`
				} else {
					text += `${TAB}${correctedLine + 1}|${TAB_SM}${line}\n`;
				}
			}

			console.log(boxen(text, { title: `Page ${this.currentIndex + 1} of ${this.result.length}`, titleAlignment: "left", padding: {top: 1, left: 1.5, right: 1.5, bottom: 1}, margin: this.margin }))

			this.showOptionsList("");
		})
	}

	showOptionsList(current: string) {
		let indent = " ".repeat(Math.round(this.margin * 4))
		if (current !== "snapshots") console.log(indent + `> Press [${c.bold("S")}] to get a list of all captured snapshots.`)
		if (current !== "main") console.log(indent + `> Press [${c.bold("R")}] to return to the main window.`);
		if (current === "main" && this.result.length > 1) console.log(indent + `> Press [${c.bold("LEFT")}] to navigate to the previous run or [${c.bold("RIGHT")}] for the next run.`);
		console.log(indent + `> Press [${c.bold("E")}] to exit the debugger.`);

		const [rl, answer] = readChar(indent + "What would you like to do?\n" + indent, (char: string, key: any) => {
			return ["s", "r", "e"].indexOf(char) > -1 || ["right", "left"].indexOf(key.name) > -1 && this.result.length > 1
		})
		this.readListeners.push(rl);
		answer.then(({char, event}) => {
			if (char === "s") {
				this.formatSnapshots(this.result[this.currentIndex])
			} else if (char === "r") {
				this.printMain();
			} else if (char === "e") {
				process.exit(0);
			} else if (event.name === "left" && this.result.length > 1) {
				this.currentIndex = (this.currentIndex - 1) < 0 ? this.result.length - 1 : this.currentIndex - 1;
				this.printMain()
			} else if (event.name === "right" && this.result.length > 1) {
				this.currentIndex = (this.currentIndex + 1) >= this.result.length ? 0 : this.currentIndex + 1;
				this.printMain()
			}
		})
	}

	formatAssertions(obj: OutputObject): any {
		let output = "";
		const TAB = " ".repeat(6);
		const TAB_SM = " ".repeat(3);
		// Loop through all the assertions and check if they're in a group.
		// If they are, print the group name and the assertion.
		// If they aren't, print the assertion.
		let file = obj.inputFile;
		let groups = obj.result.groups;
		// Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
		let groupMap = {};
		for (const group of Object.keys(groups)) {
			for (const assertion of groups[group]) {
				groupMap[assertion] = group;
			}
		}
		// Store all assertions
		let assertions = Object.values(obj.result.assertions);

		for (const assertion of assertions) {
			let name = assertion.name;
			// If the assertion passed we want to write a "PASS" sign with green background
			// If the assertion failed we want to write a "FAIL" sign with red background
			let color = assertion.result ? c.bg.green : c.bg.red;
			let sign = assertion.result ? "PASS" : "FAIL";
			// Remove the path of the config from the filepath since we don't want to list literally the whole thing.
			let replacedFile = file.replace(process.cwd(), "");
			output += groupMap[name] ? `${c.blue(groupMap[name])}: ` : "";
			output += color(sign) + " " + `${replacedFile}:${assertion.line + 1}` + "\n";
			if (assertion.description) output += TAB + assertion.description + "\n";
			output += `${TAB}${c.blue("content")}: ${c.yellow(assertion.content)}\n\n`

			// If the assertion failed, we want to print the line where it failed and the following 5 lines;
			if (!assertion.result) {
				for (const [lineNumber, line] of Object.entries(assertion.context)) {
					let correctedLine = parseInt(lineNumber, 10);

					let strLine = (correctedLine + 1).toString().padStart(2, " ");
					if (correctedLine === assertion.line) {
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

type ReadlinePromise = { char: string, event: any };
function readChar(message: string, verify = (char: string, key: any) => true): [readline.Interface, Promise<ReadlinePromise>] {
	const ac = new AbortController();
	const signal = ac.signal;
	var rl = readline.createInterface({ input, output });
	return [rl, new Promise<ReadlinePromise>((resolve, reject) => {

		const listener = (char: string, k: any) => {
			if (verify(char, k)) {
				const closeListener = () => {
					resolve({ char: char, event: k })
				}
				rl.on("close", closeListener)
				process.stdin.removeListener("keypress", listener)
				ac.abort()
				rl.close();
			} else {
				readline.clearLine(process.stdout, 0)
				readline.moveCursor(process.stdout, -1, 0)
			}
		}
		process.stdin.on("keypress", listener)
		rl.question(message, { signal }, () => {})
	})]
}

function readString(message: string, verify = (str: string) => true): [readline.Interface, Promise<string>] {
	var rl = readline.createInterface({ input, output });
	return [rl, new Promise<string>((resolve, reject) => {
		rl.question(message, (answer: string) => {
			rl.close()
			if (verify(answer)) {
				resolve(answer);
			} else {
				readString(message, verify)
			}
		})
	})]
}

export { ResultPrinter }