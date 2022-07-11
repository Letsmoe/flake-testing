#!/usr/bin/env node
import { Flake, allowExecution, OutputObject } from "@flake-universal/core";
import { RewriteJavaScriptFileContent } from "./rewriteFiles.js";
import { default as HTTPServer } from "./HttpServer.js";
import { InitTestEnvironment } from "./defaultScript.js";

if (allowExecution) {
	(async () => {
		// Connect to the main flake instance
		// Supply the connection with a config.
		const config = await Flake.getConfig();
		// This will use a default config if no other was found.
		const conn = Flake.connect(config, {
			displayOnSubmit: false,
			defaultFileExtension: "js",
			enableServer: true
		});
		let server: HTTPServer;

		if (config.devServer) {
			server = new HTTPServer(config, 8097, process.cwd())
		}

		// A list of booleans to prevent executing on the same script twice which will inevitably fail and cause the program to crash.
		let alreadyServed = {};

		// Subscribe to a file change event
		conn.subscribe(
			/.*\.(?:test|spec)\.(?:tsx|jsx|ts|js)/,
			(submit: Flake.SubmitFunction, hash: string, content: string) => {
				// Rewrite the test file and return it back to the flake connection
				let rewritten = RewriteJavaScriptFileContent(content);
	
				// Submit the result with a provided hash that uniquely identifies the file.
				let resultFilePath = submit(rewritten);
	
				// Run all tests in a prepared manner
				conn.prepare(hash, (err: Error | null, submit: any) => {
					if (err) {
						throw err;
					}

					if (config.devServer) {
						const serve = () => {
							alreadyServed[hash] = true;
							server.serve(resultFilePath).then((data: OutputObject) => {
								data.testFile = resultFilePath;
								data.identifier = hash;
								submit(data);
								Flake.display(conn)
							})
						}

						if (Object.keys(server.connections).length > 0) {
							serve()
						} else {
							console.clear()
							console.log("Make sure an instance of the development server is running in a browser: http://localhost:8097")
							server.on("connect", () => {
								if (!alreadyServed[hash]) {
									serve()
								}
							})
						}
					} else {
						// Run the tests and submit them to the connection.
						import(resultFilePath).then((module) => {
							// The test function is inside the modules default export
							// Execute the modules default export function.
							let testEnv = InitTestEnvironment((out: OutputObject) => {
								submit(out);
								Flake.display(conn);
							}, config)
							module.default(...testEnv);
						});
					}
				});
			}
		);
	})();
}