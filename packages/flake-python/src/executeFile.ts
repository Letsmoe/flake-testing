#!/usr/bin/env node
import { Flake, allowExecution, OutputObject } from "@flake-universal/core";
import child_process from "node:child_process";
import * as fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function rewritePythonContent(content: string) {
	return new Promise<string>((resolve, reject) => {
		child_process.execFile("python", [__dirname + "/../python/rewriter.py", content], (error, stdout, stderr) => {
			if (error) {
				throw error;
			}

			resolve(stdout);
		})
	})
}

if (allowExecution) {
	(async () => {
		// Connect to the main flake instance
		// Supply the connection with a config.
		const config = await Flake.getConfig();
		// This will use a default config if no other was found.
		const conn = Flake.connect(config, {
			displayOnSubmit: false,
			defaultFileExtension: "py",
			enableServer: true
		});

		// Subscribe to a file change event
		conn.subscribe(
			/.*\.(?:test|spec)\.(?:py)/,
			async (submit: Flake.SubmitFunction, hash: string, content: string) => {
				// Rewrite the test file and return it back to the flake connection
				let rewritten = await rewritePythonContent(content);

				rewritten = fs.readFileSync(__dirname + "/../python/receiver.py").toString() + "\n" + rewritten;
	
				// Submit the result with a provided hash that uniquely identifies the file.
				let resultFilePath = submit(rewritten);
	
				// Run all tests in a prepared manner
				conn.prepare(hash, (err: Error | null, submit: any) => {
					if (err) {
						throw err;
					}
					// Run the tests and submit them to the connection.
					child_process.execFile("python", [resultFilePath], (error, stdout, stderr) => {
						if (error) {
							throw error;
						}

						submit(JSON.parse(stdout));
						Flake.display(conn)
					})
				});
			}
		);
	})();
}