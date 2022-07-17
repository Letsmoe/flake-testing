import * as chokidar from "chokidar";
import *  as fs from "fs";
import * as path from "path";

const watchers = []

export function AttachDirectoryWatcher(dir: string, callback: (event: string, file: string) => void) {
	let watcher = chokidar.watch(dir).on("all", (event: string, file: string) => {
		callback(event, file);
	})

	watchers.push(watcher);
}

export function isdir(path: string): boolean {
	return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

export function isfile(path: string): boolean {
	return fs.existsSync(path) && fs.statSync(path).isFile();
}


export function searchDirectory(dir: string, depth: number = Infinity, currentDepth: number = 0): string[] {
	// An array to store all found files.
	var arrFiles = [];
	if (isdir(dir)) {
		const files = fs.readdirSync(dir);
		for (let i = 0; i < files.length; i++) {
			let p = path.join(dir, files[i]);

			if (isdir(p)) {
				if ((currentDepth + 1) < depth) {
					arrFiles = arrFiles.concat(searchDirectory(p, depth, currentDepth + 1));
				}
			} else {
				arrFiles.push(p);
			}
		}
	}

	return arrFiles;
}

process.on("exit", () => {
	watchers.forEach(async watcher => {
		await watcher.close()
	});
})