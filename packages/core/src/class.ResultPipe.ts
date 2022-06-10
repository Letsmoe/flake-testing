import * as chokidar from "chokidar";
import { FlakeConfigObject } from "./config/config.type.js";
import { readConfig } from "./config/readConfig.js";
import { args } from "./args.js";
import { validateConfig } from "./config/validateConfig.js";
import * as path from "path";
import * as fs from "fs";
import { generateRandomString } from "./utils/randomString.js";

/**
 * Whenever we want to execute a test, we would normally take the test file and run it in some kind of enclosed space so we can make sure our results are not
 * being corrupted by some unwanted side effects.
 * Since we want to be able to execute test files written in multiple languages and there might not be a wrapper around this language for JavaScript,
 * we want to share our test results across files, meaning every test result will be written to disk where it can be picked up from here.
 * 
 * Since we know that a common folder has already been created we can just use this as a bridge between the test runner and the result provider.
 * We'll just need to read from the file system on regular intervals.
 * 
 * Another option is to listen for any events via an HTTP endpoint that can be queried and which will accept our test results.
 * 
 * NOTE:
 * Since we know that every testing environment will process a test like this:
 * ```js
 * describe("{DESCRIPTION}", () => {
 * 	it("{ITEM}", () => {
 * 		expect(XYZ).toBe(ABC);
 * 	})
 * })```
 * 
 * We can rely on a common denominator to extract the description and item from the test file which can then be displayed later on.
 * In the process we might as well collect data about the test runner and of course specify information about the test file.
 */

type ResultListener = (eventName: string, filePath: string) => void;

class ResultPipe {
	private config: FlakeConfigObject;
	private dir: string;
	private listeners: Map<ResultListener, ResultListener> = new Map();
	private channels: {[key: string]: boolean} = {};
	constructor() {
		let configPath = path.dirname(path.join(process.cwd(), args.config))
		
		// Read the config file.
		readConfig(configPath).then(config => {
			validateConfig(config);
			this.config = config;
			this.dir = path.join(process.cwd(), config.dir);
			this.createTempFolder();

			// Start watching the folder for changes in case the watch parameter was given.
			if (config.watch) {
				chokidar.watch(this.dir).on("all", (event, path) => {
					this.listeners.forEach((listener) => {
						listener(event, path);
					})
				})
			}
			this.ready();
		})
	}

	public ready() {}

	attach(callback: ResultListener) {
		this.listeners.set(callback, callback);
	}

	detach(callback: ResultListener) {
		this.listeners.delete(callback);
	}

	/**
	 * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
	 * @date 6/8/2022 - 11:34:52 PM
	 *
	 * @private
	 */
	private createTempFolder() {
		const FOLDER_NAME = ".flake";
		const TEMP_FOLDER = path.join(this.dir, FOLDER_NAME);
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
		// Create both folders if they don't already exist.
		if (!fs.existsSync(CACHE_FOLDER)) {
			fs.mkdirSync(CACHE_FOLDER);
		}
		if (!fs.existsSync(RESULT_FOLDER)) {
			fs.mkdirSync(RESULT_FOLDER);
		}
	}

	/**
	 * A function to open a new channel for writing to a file with a unique job identifier.
	 * @returns A unique identifier that may only be used for writing a file once, will be deactivated afterwards.
	 */
	public open() {
		let random: string;
		do {
			random = Date.now().toString() + "__" + generateRandomString(4);
		} while (random in this.channels)
		this.channels[random] = true;
		return random;
	}

	public getChannel(channel: string) {
		if (channel in this.channels) {
			let file = path.join(this.dir, ".flake", "results", channel);
			if (fs.existsSync(file)) {
				return {
					getPath: () => file,
					getContent: () => fs.readFileSync(file, "utf8"),
					stream: () => fs.createReadStream(file),
					asJSON: () => JSON.parse(fs.readFileSync(file, "utf8")),
					dump: () => console.log(fs.readFileSync(file, "utf8")),
					delete: () => {
						fs.unlinkSync(file);
						delete this.channels[channel];
					}
				};
			}
		} else {
			console.error("Channel could not be found.");
		}
	}

	/**
	 * A function to write the results of a test to a file, then notifying all listeners of the event and closing the channel afterwards.
	 * @param identifier A unique identifier corresponding to an open channel.
	 * @param content The content to write to the file.
	 */
	public write(identifier: string, content: string | object) {
		// Check if the identifier channel is still open, an identifier may only be used once.
		if (identifier in this.channels && this.channels[identifier] === true) {
			// Convert content to string if it is an object.
			if (typeof content === "object") {
				content = JSON.stringify(content);
			}
			// Write the content to the file.
			fs.writeFileSync(path.join(this.dir, ".flake", "results", identifier), content);
			// Notify all listeners of the event.
			this.listeners.forEach((listener) => {
				listener("write", path.join(this.dir, ".flake", "results", identifier));
			})
			// Close the channel.
			this.channels[identifier] = false;
		} else if (!(identifier in this.channels)) {
			throw new Error(`The identifier ${identifier} has never existed.`);
		} else {
			throw new Error(`The identifier ${identifier} has already been closed.`);
		}
	}

	public getCacheFolder() {
		return path.join(this.dir, ".flake", "cache");
	}
}

export { ResultPipe }