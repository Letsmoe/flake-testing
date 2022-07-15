#!/usr/bin/env node
import child_process from "node:child_process";
import { Reasons, Properties } from "@flake-universal/core"

async function loader() {
	return new Promise<object>(async (resolve, reject) => {
		this.set(Properties.USE_REWRITE, false)
		// Get the config from the running instance.
		const config = this.getConfig();
		// Get all user-defined options.
		const options = this.getOptions();
		const filePath = this.getFile();
		// Run the tests and resolve the promise
		child_process.execFile(
			"python",
			[filePath],
			(error: Error, stdout: string, stderr: string) => {
				if (error) {
					throw error;
				}

				try {
					let json = JSON.parse(stdout);
					resolve(json)
				} catch {
					reject(Reasons.JSON_PARSE_ERROR)
				}
			}
		);
	})
}

export { loader };
