#!/usr/bin/env node

import * as fs from "fs";
import { ResultPrinter } from "../display/ResultPrinter.js";
import { error, Properties, Reasons } from "../shared.js";
import * as path from "path";
import {
	AttachDirectoryWatcher,
	searchDirectory,
} from "../DirectoryWatcher.js";
import { getUtils } from "../ModuleUtils.js";
import getPort from "get-port";
import {
	AssertionObject,
	OutputObject,
	SnapshotObject,
} from "../types/index.js";
import Server from "../Server.js";
import WebSocketServer from "../WebSocketServer.js";
import { spawn } from "node:child_process";
import { args } from "./Args.js";
import { DEFAULT_LOADERS } from "../Loaders.js";
import { Rule } from "../config/config.type.js";
import { readConfig } from "../config/readConfig.js";

const configPath = path.join(process.cwd(), args.config);
const configFolder = path.dirname(configPath);

// Read the config file
let config = readConfig(configPath);
config.exclude = config.exclude.concat([".*\\.flake.*"]);
// The directory containing all test files, we can just use the config directory since it points to the dir folder.
const dir = path.join(configFolder, config.dir);

function createResultFolder(root: string) {
	/**
	 * Create all folders for storing results
	 */
	const FOLDER_NAME = ".flake";
	const TEMP_FOLDER = path.join(root, FOLDER_NAME);
	// Create the folder if it doesn't exist already.
	if (!fs.existsSync(TEMP_FOLDER)) {
		fs.mkdirSync(TEMP_FOLDER);
	}

	// Now create the subfolders we need to keep everything organized.
	/**
	 * The cache folder is where all bundled files will be stored,
	 * this will ensure we don't recompile whole projects just because of a single change to a file that didn't even matter to us.
	 */
	const CACHE_FOLDER = path.join(TEMP_FOLDER, "cache");

	/**
	 * The result folder is where all result files are being stored,
	 * their names correspond to their unique job identifiers created through a sha256 hash on the test file.
	 */
	const RESULT_FOLDER = path.join(TEMP_FOLDER, "results");
	// Remove the cache folder and create it once again
	if (fs.existsSync(CACHE_FOLDER)) {
		fs.rmSync(CACHE_FOLDER, { recursive: true });
	}
	if (!fs.existsSync(RESULT_FOLDER)) {
		fs.mkdirSync(RESULT_FOLDER);
	}
	fs.mkdirSync(CACHE_FOLDER);
}

(function () {
	// Get a list of all rules we might want to follow.
	const rules = this.config.rules || [];
	if (this.config.useDefaultLoaders) {
		rules.push(...DEFAULT_LOADERS);
	}

	createResultFolder(this.dir);

	/**
	 * Check whether the directory should be watched, if the CLI option is true we just ignore the config.
	 */
	const watch =
		args.watch === false ? false : this.config.watch || args.watch;

	if (watch === true) {
		// Watch the directory for changes (deep).
		AttachDirectoryWatcher(
			this.dir,
			async (eventType: string, file: string) => {
				if (eventType === "add" || eventType === "change") {
					SubmitFileChange(file, file.replace(this.dir, ""), rules)
						.then((result) => {
							WriteResult(this.dir, result);
							submit(getResultArray());
						})
						.catch(() => {});
				}
			}
		);
	} else {
		runAllFiles();
	}

	function runAllFiles() {
		// Loop through all files in the directory (maybe deeply) and submit all files once.
		let depth = 1;
		if (this.config.deepSearch) {
			/**
			 * If the config setting "deepSearch" is true we want to scan all subdirectories as well,
			 * the depth must be infinite since we don't know how many subdirectories we're expecting.
			 */
			depth = Infinity;
		}
		/**
		 * Since we want to retrieve the absolute and relative file paths to our root directory we can simply map the absolute paths to an array of absolute and relative,
		 * a relative path just means subtracting the root from the absolute path.
		 */
		searchDirectory(this.dir, depth)
			.map((x) => [x, x.replace(this.dir, "")])
			.forEach(async ([absFile, file]) => {
				SubmitFileChange(absFile, file, rules)
					.then((result) => {
						WriteResult(this.dir, result);
						submit(getResultArray());
					})
					.catch((err) => {
						console.log(err);
					});
			});
	}

	const printer = new ResultPrinter();

	const submit = (files: any[]) => {
		this.wsServer.submit(files);
		printer.print(files);
	};

	const getResultArray = () => {
		let resultPath = path.join(this.dir, ".flake", "results");
		let files = fs.readdirSync(resultPath);
		// Get the 10 latest files (we can just sort by filename, because they resemble the capturing dates.)
		files = files.sort((a, b) => parseInt(b) - parseInt(a));
		let fileArray = [];
		for (let i = 0; i < files.length; i++) {
			let file = files[i];
			let content = fs.readFileSync(path.join(resultPath, file), "utf-8");
			fileArray.push(JSON.parse(content));
		}
		return fileArray;
	};

	//if (config.localServer) {
	(async () => {
		const WebServerPort = this.config.devServer.port;
		const WebSocketServerPort = this.config.devServer.api.port;

		this.server = new Server(WebServerPort, WebSocketServerPort);
		this.wsServer = new WebSocketServer(WebSocketServerPort);
		this.wsServer.root = this.dir;

		function exitHandler(options: any, exitCode: number) {
			console.log("Shutting down server.");
			this.server.close();
			this.wsServer.close();
			if (exitCode || exitCode === 0) console.log(exitCode);
			if (options.exit) process.exit();
		}

		//do something when app is closing
		process.on("exit", exitHandler.bind(this, { cleanup: true }));

		//catches ctrl+c event
		process.on("SIGINT", exitHandler.bind(this, { exit: true }));

		// catches "kill pid" (for example: nodemon restart)
		process.on("SIGUSR1", exitHandler.bind(this, { exit: true }));
		process.on("SIGUSR2", exitHandler.bind(this, { exit: true }));

		//catches uncaught exceptions
		process.on("uncaughtException", exitHandler.bind(this, { exit: true }));

		this.wsServer.onMessage("REMOVE_ALL", () => {
			let files = fs.readdirSync(path.join(dir, ".flake", "results"));

			files.forEach((file) => {
				let p = path.join(dir, "/.flake/results/", file);
				if (fs.existsSync(p)) {
					fs.rmSync(p);
				}
			});
			submit([]);
		});

		this.wsServer.onMessage("RUN_ALL", () => {
			runAllFiles();
		});

		this.wsServer.onMessage(
			"OPEN_FILE",
			(data: { file: string; line: number; column: number }) => {
				// Check if vscode is installed, then we can open at the specified line
				if (
					data.hasOwnProperty("line") &&
					data.hasOwnProperty("column")
				) {
					let vsVersion = spawn("code", ["--version"]);
					vsVersion.on("close", (code) => {
						if (code === 0) {
							// VSCode is installed, open the file with that.
							spawn("code", [
								"--goto",
								`${data.file}:${data.line}:${data.column}`,
							]);
						} else {
							open(data.file);
						}
					});
				} else {
					open(data.file);
				}
			}
		);

		printer.addHeader(
			`Local server opened: http://localhost:${WebServerPort}`
		);
		// Reserve a header that can be updated once a client connects to the server.
		let setWsHeader = printer.reserveHeader(
			`WebSocket server opened on port ${WebSocketServerPort}; 0 clients connected;`
		);
		this.wsServer.onStateChange = () => {
			setWsHeader(
				`WebSocket server opened on port ${WebSocketServerPort}; ${this.wsServer.connectionCount} clients connected;`
			);
		};
	})();
	//}
}.bind({
	config,
	dir,
})());

function WriteResult(dir: string, result: OutputObject) {
	fs.writeFileSync(
		path.join(dir, ".flake", "results", Date.now().toString()),
		JSON.stringify(result)
	);
}

async function SubmitFileChange(
	absFile: string,
	relFile: string,
	rules: Rule[]
): Promise<OutputObject> {
	return new Promise((resolve, reject) => {
		if (fs.lstatSync(absFile).isFile()) {
			for (let i = 0; i < config.exclude.length; i++) {
				const exclude = new RegExp(config.exclude[i]);
				if (exclude.test(relFile)) {
					return;
				}
			}

			// Loop through all rules to find a matching one for each file.
			for (let i = 0; i < rules.length; i++) {
				const rule = rules[i];
				const test = new RegExp(rule.test);
				if (!test.test(relFile)) {
					// The test failed, let's continue to the next rule.
					continue;
				}

				// Loop through all tasks defined for this rule.
				for (let j = 0; j < rule.use.length; j++) {
					const task = rule.use[j];
					if (task.loader) {
						// A loader is defined, let's follow the specified package, meaning we import it and run the default function.
						import(task.loader)
							.then(async (module) => {
								const settings = {};
								settings[Properties.DEFAULT_FILE_EXTENSION] =
									"";

								if (!module.default) {
									error(
										"A loader must export a default function!"
									);
								}

								const utils = getUtils.bind({
									config,
									options: task.options,
									dir,
									absolutePath: absFile,
									relativePath: relFile,
								})();

								let newPath = path.join(
									dir,
									path.dirname(relFile),
									Math.random().toString()
								);

								const addFileExtension = (
									p: string,
									ext: string
								) => {
									if (ext) {
										return p + "." + ext;
									}
									return p;
								};

								utils.submit = (rewritten: string) => {
									newPath = addFileExtension(
										newPath,
										settings[
											Properties.DEFAULT_FILE_EXTENSION
										]
									);
									fs.writeFileSync(newPath, rewritten);
									return newPath;
								};
								utils.set = (
									option: Properties,
									value: any
								) => {
									settings[option] = value;
								};
								utils.get = (option: Properties) => {
									return settings[option];
								};
								utils.getFile = () => {
									return absFile;
								};

								module.default
									.bind(utils)()
									.then((result) => {
										result = ManageResult(result, absFile);
										if (utils.get(Properties.USE_REWRITE)) {
											fs.rmSync(newPath);
										}
										resolve(result);
									})
									.catch((err: number) => {
										if (err == Reasons.JSON_PARSE_ERROR) {
											console.error(
												"Error parsing returned JSON, tests might not have returned properly."
											);
										}
										if (utils.get(Properties.USE_REWRITE)) {
											fs.rmSync(newPath);
										}
										reject();
									});
							})
							.catch((err) => {
								console.error(
									"Importing loader '" +
										task.loader +
										"' failed: " +
										err
								);
							});
					}
				}
			}
		}
	});
}

function ManageResult(result: OutputObject, origin: string) {
	result.inputFile = origin;
	// Add context to all failed tests
	let fileContent = fs.readFileSync(origin, "utf-8");
	let lines = fileContent.split("\n");

	const getContext = (line: number) => {
		let contextLines = {};
		// We can't get any information about what lines we're looking at if we hit the end of the file, so we have to reorder the lines into an object ({line: content})
		for (let i = 0; i < lines.length; i++) {
			if (i >= line - config.contextualLines && i <= line + config.contextualLines) {
				contextLines[i] = lines[i];
			}
		}
		return contextLines;
	};
	result.result.assertions.forEach((assertion: AssertionObject) => {
		// Get the line and add context from the lines around it.
		assertion.context = getContext(assertion.line);
	});
	result.snapshots.forEach((snapshot: SnapshotObject) => {
		// Get the line and add context from the lines around it.
		snapshot.context = getContext(snapshot.event.line);
	});
	return result;
}
