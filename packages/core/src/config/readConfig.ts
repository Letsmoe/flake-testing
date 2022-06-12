/**
 * @author Letsmoe
 * @email moritz.utcke@gmx.de
 * @create date 2022-06-08 19:43:36
 * @modify date 2022-06-08 19:43:36
 */

import * as fs from "fs";
import * as yaml from "js-yaml";
import { FlakeConfigObject } from "./config.type.js";
import { defaultConfig } from "./defaultConfig.js";

/**
 * A function that, given an input directory, will read all files inside the given directory returning a config object which, 
 * if a yaml, js or json file existed in the directory that matched the "flake.(config).(yaml|js|json)" pattern, will correspond to that file,
 * if no file matched the pattern, the default config will be returned.
 * @date 6/8/2022 - 7:41:19 PM
 * 
 * @param {string} dirPath The path to the directory that contains the config file.
 * @returns {Promise<FlakeConfigObject>} A config object.
 */
function readConfig(dirPath: string): Promise<FlakeConfigObject> {
	
	/**
	 * There are multiple names a config should have, it can also either be a .js or a .json file meaning we'll have to look for both variants.
	 * In case of a .json file it is as simple as reading the file into memory and returning it.
	 * In case it is a .js file, we'll need to import the default export from the file and return that.
	 *
	 * Let's start by looking at all files in the given directory and checking if they match this pattern:
	 * 		/flake(?:\.config)?\.js(?:on)?/
	 *
	 * Since we might need to import it is better to return a promise so we can await a potential async import.
	 */

	return new Promise<FlakeConfigObject>((resolve, reject) => {
		const JSON_TEST = /flake(?:\.config)?\.json/;
		const JS_TEST = /flake(?:\.config)?\.js/;
		const YAML_TEST = /flake(?:\.config)?\.yaml/;

		// Get all files in the given directory
		const files = fs.readdirSync(dirPath);
		// Iterate through all the files and match the RegExp to them.
		for (const file of files) {
			// Check if the file matches the JSON pattern.
			if (JSON_TEST.test(file)) {
				// If it does, return the file contents as JSON.
				let obj = JSON.parse(
					fs.readFileSync(`${dirPath}/${file}`, "utf8")
				);
				obj.own.dirPath = dirPath
				obj.own.fileName = dirPath + "/" + file
				resolve(Object.assign(defaultConfig, obj));
			} else if (JS_TEST.test(file)) {
				// If it matches the JavaScript test, import the default export from the file and return that.
				import(`${dirPath}/${file}`).then((module) => {
					module.default.own.dirPath = dirPath
					module.default.own.fileName = dirPath + "/" + file
					resolve(Object.assign(defaultConfig, module.default));
				});
			} else if (YAML_TEST.test(file)) {
				// If it matches the YAML test, import the default export from the file and return that.
				let obj = yaml.load(
					fs.readFileSync(`${dirPath}/${file}`, "utf8")
				) as FlakeConfigObject;
				obj.own.dirPath = dirPath
				obj.own.fileName = dirPath + "/" + file
				resolve(Object.assign(defaultConfig, obj));
			}
		}

		// We didn't find any files, so return the default config.
		defaultConfig.own.dirPath = dirPath
		resolve(defaultConfig);
	});
}

export { readConfig }