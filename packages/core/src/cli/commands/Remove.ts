import { getResults } from "../../utils/results.js";
import * as fs from "fs"

export default function RemoveCommand(args) {
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
}