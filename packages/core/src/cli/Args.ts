import ListCommand from "./commands/List.js";
import ShowCommand from "./commands/Show.js";
import RemoveCommand from "./commands/Remove.js";
import { colarg } from "colarg";
import { getResults } from "../utils/results.js";
import { CURRENT_VERSION, safe_exit } from "../shared.js";
import * as fs from "fs";

let parser = new colarg(process.argv.slice(2));

parser.addOption({
	name: "version",
	alias: "v",
	type: "any",
	description: "Displays the version information of this package.",
	callback: () => {
		process.stdout.write(CURRENT_VERSION);
		safe_exit();
	},
});

parser.addOption({
	name: "config",
	alias: "p",
	description: "A relative path to a configuration file.",
	required: false,
	type: "string",
	defaults: "flake.config.json",
});

parser.addOption({
	name: "watch",
	alias: "w",
	description: "Whether to watch the directory for changes.",
	required: false,
	type: "boolean",
	defaults: false,
});

parser.addCommand(
	{
		name: "ls",
		description: "Display a list of all tests stored in the .flake folder",
		args: [],
	},
	ListCommand
);
parser.addCommand(
	{
		name: "snapshots",
		description:
			"Display a list of snapshots from the most recent test or a specific run.",
		args: [],
	},
	() => {
		process.exit();
	}
);
parser.addCommand(
	{
		name: "show",
		description:
			"Display a specific test run, picked by an index (use 'flake ls' for that) or the newest one.",
		args: [
			{
				name: "index",
				alias: "x",
				description: "The index to display results from.",
				required: false,
				type: "number",
			},
		],
	},
	ShowCommand
);

parser.addCommand(
	{
		name: "rm",
		description: "Remove a specific test run.",
		args: [
			{
				name: "index",
				alias: "x",
				description: "The index to display results from.",
				required: false,
				type: "number",
			},
		],
	},
	RemoveCommand
);

parser.addCommand(
	{
		name: "rma",
		description: "Remove all previously executed test runs.",
		args: [],
	},
	() => {
		let files = getResults();

		files.forEach((file, i) => {
			let p = process.cwd() + "/.flake/results/" + file;
			if (fs.existsSync(p)) {
				fs.rmSync(p);
				console.log("Successfully removed test at index " + i);
			}
		});
		process.exit(0);
	}
);

parser.enableHelp();

export const args = parser.getArgs();