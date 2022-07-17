/**
 * @author Letsmoe
 * @email moritz.utcke@gmx.de
 * @create date 2022-06-08 19:43:36
 * @modify date 2022-07-12 23:05:52
 */
import * as fs from "fs";
import * as yaml from "js-yaml";
import deepAssign from "../utils/deepAssign.js";
import { defaultConfig } from "./defaultConfig.js";
import { validateConfig } from "./validateConfig.js";
/**
 * A function that, given an input directory, will read all files inside the given directory returning a config object which,
 * if a yaml, js or json file existed in the directory that matched the "flake.(config).(yaml|js|json)" pattern, will correspond to that file,
 * if no file matched the pattern, the default config will be returned.
 * @date 6/8/2022 - 7:41:19 PM
 *
 * @param {string} filePath The path to the file that shall be used as config.
 * @returns {FlakeConfigObject} A config object.
 */
function readConfig(filePath) {
    // We want to support both yaml and json files, let's test against the file name to find out what we have
    var JSON_TEST = /.*\.json/;
    var YAML_TEST = /.*\.yaml/;
    // Check if the file matches the JSON pattern.
    if (JSON_TEST.test(filePath)) {
        // If it does, return the file contents as JSON.
        var obj = JSON.parse(fs.readFileSync(filePath, "utf8"));
        validateConfig(obj);
        return deepAssign(defaultConfig, obj);
    }
    else if (YAML_TEST.test(filePath)) {
        // If it matches the YAML test, load the yaml file and return as json.
        var obj = yaml.load(fs.readFileSync(filePath, "utf8"));
        validateConfig(obj);
        return deepAssign(defaultConfig, obj);
    }
    // We didn't find any files, so return the default config.
    return defaultConfig;
}
export { readConfig };
//# sourceMappingURL=readConfig.js.map