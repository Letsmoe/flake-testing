#!/usr/bin/env node
import child_process from "node:child_process";
import * as fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Reasons } from "@flake-universal/core";
const __dirname = dirname(fileURLToPath(import.meta.url));
function rewritePythonContent(content) {
    return new Promise((resolve, reject) => {
        child_process.execFile("python", [__dirname + "/../python/rewriter.py", content], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            resolve(stdout);
        });
    });
}
/**
 * A loader is a function that takes a specific file path, modifies the contents of that file and returns new content.
 * This function is always called asynchronously since most processes of executing and altering a file can not be called synchronously.
 * A loader can be included in a config through a corresponding npm package like this:
 * ```json
 * {
 * 	"rules": [
 * 		{
 * 			"test": "{{file:js}}",
            "use": [
                {
                    "loader": "flake-javascript",
                    "options": {}
                }
            ]
 * 		}
 * 	]
 * }
 * ```
 *
 * @async
 */
async function loader() {
    return new Promise(async (resolve, reject) => {
        //this.set(Properties.USE_REWRITE, false)
        // Get the config from the running instance.
        const config = this.getConfig();
        // Get all user-defined options.
        const options = this.getOptions();
        /**
         * Request the file's content from the flake instance, loaders should not read files themselves!
         */
        const content = this.getFileContent();
        // Rewrite the test file so we have some real content to run our tests on.
        let rewritten = await rewritePythonContent(content);
        // Since we can't execute from the JS instance, we need to concat with the "receiver.py" file, this will ensure the tests can run, results will be printed to stdout.
        rewritten =
            fs
                .readFileSync(__dirname + "/../python/receiver.py")
                .toString() +
                "\n" +
                rewritten;
        // Submit the result, the main instance will save the file and return the absolute path to it, so that we can load it.
        let resultFilePath = this.submit(rewritten);
        // Run the tests and resolve the promise
        child_process.execFile("python", [resultFilePath], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            try {
                let json = JSON.parse(stdout);
                resolve(json);
            }
            catch {
                reject(Reasons.JSON_PARSE_ERROR);
            }
        });
    });
}
export { loader };
