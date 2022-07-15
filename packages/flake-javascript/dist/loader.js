#!/usr/bin/env node
import { Reasons, Properties } from "@flake-universal/core";
import { default as HTTPServer } from "./HttpServer.js";
import child_process from "node:child_process";
export default async function loader() {
    return new Promise((resolve, reject) => {
        this.set(Properties.USE_REWRITE, false);
        this.set(Properties.DEFAULT_FILE_EXTENSION, "js");
        // Get the config from the running instance.
        const config = this.getConfig();
        // Get all user-defined options.
        const options = this.getOptions();
        /**
         * Request the file's content from the flake instance, loaders should not read files themselves!
         */
        let server;
        if (options.server) {
            server = new HTTPServer(config, 8097, process.cwd());
        }
        // A list of booleans to prevent executing on the same script twice which will inevitably fail and cause the program to crash.
        let alreadyServed = {};
        let filePath = this.getFile();
        // Run all tests in a prepared manner
        if (options.server) {
            const serve = () => {
                alreadyServed[filePath] = true;
                server.serve(filePath).then((data) => {
                    resolve(data);
                });
            };
            if (Object.keys(server.connections).length > 0) {
                serve();
            }
            else {
                console.clear();
                console.log("Make sure an instance of the development server is running in a browser: http://localhost:8097");
                server.on("connect", () => {
                    if (!alreadyServed[filePath]) {
                        serve();
                    }
                });
            }
        }
        else {
            // Run the tests and submit them to the connection.
            child_process.execFile("node", [filePath], (err, stdout) => {
                if (err) {
                    throw err;
                }
                try {
                    let json = JSON.parse(stdout);
                    // We need to find the content for each assertion ourselves since we can't figure that out inside the js process.
                    let content = this.getFileContent();
                    let lines = content.replace(/\r\n/g, "\n").split("\n");
                    json.result.assertions.forEach(assert => {
                        let line = lines[assert.line];
                        let match = line.match(/assert\((.*)\)/);
                        assert.content = `assert(${match ? match[1] : ""})`;
                    });
                    resolve(json);
                }
                catch (err) {
                    reject(Reasons.JSON_PARSE_ERROR);
                }
            });
        }
    });
}
