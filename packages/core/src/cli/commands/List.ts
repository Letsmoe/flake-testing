import { basename } from "path";
import { c } from "../../display/color.js";
import { AssertionObject } from "../../types";
import { getResults } from "../../utils/results.js";
import * as fs from "fs";

export default function ListCommand() {
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
}