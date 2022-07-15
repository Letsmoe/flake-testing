import { ResultPrinter } from "../../display/ResultPrinter.js";
import { getResults } from "../../utils/results.js";
import * as fs from "fs";

export default function ShowCommand(args) {	
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
}