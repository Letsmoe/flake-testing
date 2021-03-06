/**
 * @author Letsmoe
 * @email moritz.utcke@gmx.de
 * @create date 2022-06-08 19:43:36
 * @modify date 2022-07-12 23:05:52
 */
import { FlakeConfigObject } from "./config.type.js";
/**
 * A function that, given an input directory, will read all files inside the given directory returning a config object which,
 * if a yaml, js or json file existed in the directory that matched the "flake.(config).(yaml|js|json)" pattern, will correspond to that file,
 * if no file matched the pattern, the default config will be returned.
 * @date 6/8/2022 - 7:41:19 PM
 *
 * @param {string} filePath The path to the file that shall be used as config.
 * @returns {FlakeConfigObject} A config object.
 */
declare function readConfig(filePath: string): FlakeConfigObject;
export { readConfig };
