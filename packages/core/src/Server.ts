import * as mime from "mime-types";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { __dirname } from "./dirname.js"

export default class Server {
	private instance: http.Server;
	constructor(port: number = 8086, private socketServerPort: number = 8088) {
		this.instance = http.createServer(this.requestListener.bind(this));
		this.instance.listen(port);
	}

	public close(): void {
		this.instance.close()
	}

	public requestListener(req: http.IncomingMessage, res: http.ServerResponse) {
		let p = path.join(__dirname, "../assets/", req.url == "/" ? "index.html" : req.url);
		if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
			let type = mime.lookup(p) as string
			res.setHeader("Content-Type", type);
			res.writeHead(200);
			let content = fs.readFileSync(p).toString();
			content = content.replace(/ws:\/\/localhost:8088/g, "ws://localhost:" + this.socketServerPort)
			res.end(content);
		} else {
			res.setHeader("Content-Type", "text/html");
			res.writeHead(200)
			res.end("<h1>Missing files, consider reinstalling.</h1>")
		}
	}
}