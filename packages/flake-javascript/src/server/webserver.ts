import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class WebServer {
	private server: http.Server;
	constructor(public port: number = 7072, public baseFolder : string = process.cwd()) {
		this.server = http.createServer(this.provider.bind(this))
		this.server.listen(port, '127.0.0.1');
		console.log("Opened a local server on port " + port);
	}
	
	getFile(fileName : string) {
		if (fs.existsSync(fileName) && fs.lstatSync(fileName).isFile()) {
			let content = fs.readFileSync(fileName, "utf8");
			let type = mime.lookup(fileName)
			return [(type as string), content];
		} else {
			console.warn("File does not exist: " + fileName);
			return ["text/plain", ""]
		}
	}

	set folder(newFolder : string) {
		this.baseFolder = newFolder;
	}

	provider(req: any, res: any) {
		let requestURL = req.url;
		let type : string, file : string;
		if (requestURL.startsWith("/index") || requestURL === "/") {
			[type, file] = this.getFile(path.join(this.baseFolder, "test/index.test.html"));
			let [x, jsContent] = this.getFile(path.join(__dirname, "./content.js"))
			file += `<script type="text/javascript">${jsContent}</script>`
		} else if (requestURL.startsWith("/overview")) {
			[type, file] = this.getFile(path.join(__dirname, "../overview.html"));
			let [x, jsContent] = this.getFile(path.join(__dirname, "../overview/index.js"))
			file += `<script type="text/javascript">${jsContent}</script>`
		} else {
			[type, file] = this.getFile(path.join(this.baseFolder, requestURL))
		}

		res.writeHead(200, {'Content-Type': type});
		res.end(file);
	}
}

export {WebServer}