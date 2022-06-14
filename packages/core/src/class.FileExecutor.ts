import { FlakeConfigObject } from "./config/config.type";
import * as fs from "fs";

class FileExecutor {
	constructor(private rewriter: Function, private executor: Function) {

	}

	public execute(file: string, options: any): Promise<any> {
		return new Promise((resolve, reject) => {
			this.executor(file, options, (err: Error, result: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	public collectFiles(matcher: RegExp, config: FlakeConfigObject): string[] {
		function dirRead(path: string): string[] {
			var files = []
			fs.readdirSync(config.dir).forEach(file => {
				if (fs.statSync(path).isDirectory()) {
					files = files.concat(dirRead(path));
				} else {
					if (matcher.test(file)) {
						files.push(path);
					}
				}
			})
			return files;
		}
		return dirRead(config.dir);
	}
}

export { FileExecutor };