import { colarg } from "colarg";
import * as fs from "fs";
import {basename} from "path"
import { c } from "./display/color.js";
import { ResultPrinter } from "./display/ResultPrinter.js";
import { AssertionObject } from "./types/index.js";
import boxen from "boxen";
import { getResults } from "./utils/results.js";

var allowExecution = true;

const args = colarg(process.argv.slice(2))
			.option({
				name: "config",
				alias: "p",
				type: "string",
				description: "The path to the config file",
				defaults: "./flake.config.json"
			}).command("snapshots", "Display a list of snapshots from the most recent test or a specific run.", () => {
				process.exit()
			}).command("ls", "Display a list of all tests stored in the .flake folder", () => {
				// Read the .flake directory
				let runs = getResults();
				// Loop through all files, the filenames are the dates where the tests have been captured.
				runs.forEach((run, i) => {
					let time = new Date(parseInt(run));
					// Read the file and check if it succeeded
					let file = JSON.parse(fs.readFileSync(process.cwd() + "/.flake/results/" + run).toString());
					let testFile = basename(file.inputFile);
					let success = file.status === true;

					let [failed, succeeded] = file.result.assertions.reduce((acc: number, curr: AssertionObject) => {
						if (curr.result === true) {
							return [acc[0], acc[1] + 1]
						} else {
							return [acc[0] + 1, acc[1]]
						}
					}, [0, 0])
			
					let ratio: string | number = (succeeded / file.result.assertions.length * 100);
					ratio = ratio > 50 ? c.bg.green(`${ratio.toFixed(1)}%`) : c.bg.red(`${ratio.toFixed(1)}%`);

					const pad = (x: string | number) => x.toString().padStart(2, '0');

					const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

					console.log(`${i} | ${c.yellow(testFile)} - ${months[time.getMonth()]} ${pad(time.getDate())} ${time.getFullYear()} ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())} [${success ? c.green("SUCCESS") : c.red("FAIL")}] | ${ratio}`)
				})

				if (runs.length == 0) {
					console.log("We could not find any test runs here 😟");
				}
				process.exit(0)
			}).command("show", "Display a specific test run, picked by an index (use 'flake ls' for that) or the newest one.", (capture) => {
				let args = capture.option({
					name: "index",
					alias: "x",
					description: "The index to display results from.",
					required: false,
					type: "number"
				}).help().args;

				let files = getResults();

				let index: number;
				if (args.index !== undefined && args.index > -1) {
					index = args.index;
				} else {
					index = files.length - 1;
				}
				// Read the file at the specified index.
				let file = fs.readFileSync(process.cwd() + "/.flake/results/" + files[index]).toString();
				let json = JSON.parse(file);

				// Pass the json results to the ResultPrinter, which will take care of printing it properly.
				let printer = new ResultPrinter();

				printer.print([json]);
				allowExecution = false;
			}).command("rm", "Remove a specific test run.", (capture) => {
				let args = capture.option({
					name: "index",
					alias: "x",
					description: "The index to display results from.",
					required: false,
					type: "number"
				}).help().args;

				let files = getResults();

				let index: number;
				if (args.index !== undefined && args.index > -1) {
					index = args.index;
				} else {
					index = files.length - 1;
				}

				let p = process.cwd() + "/.flake/results/" + files[index];
				if (fs.existsSync(p)) {
					fs.rmSync(p);
					console.log("Removing finished!")
				} else {
					console.error("File does not exist, skipping deletion of: " + p);
				}
				process.exit(0);
			}).command("rma", "Remove all previously executed test runs.", () => {
				let files = getResults();

				files.forEach((file,i) => {
					let p = process.cwd() + "/.flake/results/" + file;
					if (fs.existsSync(p)) {
						fs.rmSync(p);
						console.log("Successfully removed test at index " + i);
					}
				})
				process.exit(0);
			}).help().args;


export { args, allowExecution }