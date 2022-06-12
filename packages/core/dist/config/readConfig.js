/**
 * @author Letsmoe
 * @email moritz.utcke@gmx.de
 * @create date 2022-06-08 19:43:36
 * @modify date 2022-06-08 19:43:36
 */
import * as fs from "fs";
import * as yaml from "js-yaml";
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
function readConfig(dirPath) {
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
    return new Promise(function (resolve, reject) {
        var JSON_TEST = /flake(?:\.config)?\.json/;
        var JS_TEST = /flake(?:\.config)?\.js/;
        var YAML_TEST = /flake(?:\.config)?\.yaml/;
        // Get all files in the given directory
        var files = fs.readdirSync(dirPath);
        var _loop_1 = function (file) {
            // Check if the file matches the JSON pattern.
            if (JSON_TEST.test(file)) {
                // If it does, return the file contents as JSON.
                var obj = JSON.parse(fs.readFileSync("".concat(dirPath, "/").concat(file), "utf8"));
                obj.own.dirPath = dirPath;
                obj.own.fileName = dirPath + "/" + file;
                resolve(Object.assign(defaultConfig, obj));
            }
            else if (JS_TEST.test(file)) {
                // If it matches the JavaScript test, import the default export from the file and return that.
                import("".concat(dirPath, "/").concat(file)).then(function (module) {
                    module.default.own.dirPath = dirPath;
                    module.default.own.fileName = dirPath + "/" + file;
                    resolve(Object.assign(defaultConfig, module.default));
                });
            }
            else if (YAML_TEST.test(file)) {
                // If it matches the YAML test, import the default export from the file and return that.
                var obj = yaml.load(fs.readFileSync("".concat(dirPath, "/").concat(file), "utf8"));
                obj.own.dirPath = dirPath;
                obj.own.fileName = dirPath + "/" + file;
                resolve(Object.assign(defaultConfig, obj));
            }
        };
        // Iterate through all the files and match the RegExp to them.
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            _loop_1(file);
        }
        // We didn't find any files, so return the default config.
        defaultConfig.own.dirPath = dirPath;
        resolve(defaultConfig);
    });
}
export { readConfig };
//# sourceMappingURL=readConfig.js.map