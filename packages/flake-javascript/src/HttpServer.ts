import * as fs from "fs";
import * as path from "path";
import http from "http";
import {WebSocketServer, WebSocket, RawData} from "ws";
import mime from "mime-types"
import { fileURLToPath } from 'url';
import { FlakeConfigObject } from "@flake-universal/core/dist/config/config.type";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function randomString() {
	return (Math.random() + 1).toString(36).substring(7)
}

export default class HTTPServer {
	private server: http.Server;
	private wss: WebSocketServer;
	public connections: {[key: symbol]: WebSocket}
	private callbacks: {[key: string]: (() => void)[]} = {"connect": []}

	constructor(private config: FlakeConfigObject, public port: number = 8097, private root: string = process.cwd(), private node_dir: string = path.join(process.cwd(), "/../node_modules/")) {
		this.server = http.createServer(this.listener.bind(this));
		this.server.listen(this.port, "localhost", () => {
			console.log(`Server is running on http://localhost:${port}`);
		})

		this.connections = {};

		this.wss = new WebSocketServer({
			port: this.port + 1,
			host: "localhost"
		})

		this.wss.on("connection", (ws) => {
			let symbol = randomString();

			ws.on("message", (data: RawData) => {
				data = JSON.parse(data.toString());
				if (data.hasOwnProperty("identifier")) {
					this.processes[data["identifier"]](data["data"]);
				}
			})

			ws.on("close", () => {
				delete this.connections[symbol]
			})

			this.connections[symbol] = ws;
			this.callbacks["connect"].forEach(callback => callback())
		})
	}

	private listener(req: http.IncomingMessage, res: http.ServerResponse) {
		// Get the requested url
		let url = req.url;
		// Check if the url corresponds to a node module or a file.
		if (url === "/") {
			// We want to serve the index file
			res.setHeader('Content-Type', 'text/html');
			res.writeHead(200);
			res.end(`<!DOCTYPE html><html><body>
				<script type="module">
					import { InitTestEnvironment } from "/root/defaultScript.js";
					let ws = new WebSocket("ws://localhost:${this.port + 1}")

					ws.onmessage = (event) => {
						let data = JSON.parse(event.data);
						let file = data.data.file;
						let id = data.identifier;

						import(file).then(module => {
							let testEnv = InitTestEnvironment((result) => {
								console.log(result)
								ws.send(JSON.stringify({
									type: "POST",
									identifier: id,
									action: "RETURN_RESULT",
									data: result
								}))
							}, ${JSON.stringify(this.config)});
							module.default(...testEnv)
						})
					}

					ws.onerror = (error) => {
						console.log(error)
					}
				</script>
			</body></html>`)
		} else if (url === "/root/defaultScript.js") {
			res.setHeader("Content-Type", "text/javascript")
			res.writeHead(200)
			res.end(fs.readFileSync(path.join(__dirname, "../lib/defaultScript.js")).toString())
		} else {
			// Check if the file exists, then get the content and mime type of it.
			let content = "", type: string | false = "";
			
			if (fs.existsSync(url)) {
				content = fs.readFileSync(url).toString();
				type = mime.lookup(url);
			} else if (fs.existsSync(path.join(this.root, url))) {
				// Check if the file exists in the current directory
				content = fs.readFileSync(path.join(this.root, url)).toString();
				type = mime.lookup(path.join(this.root, url));
			}

			if (type && content) {
				res.setHeader("Content-Type", type);
				res.writeHead(200)
				res.end(content)
			} else {
				res.writeHead(404)
				res.end()
			}
		}
	}

	public on(event: string, callback: () => void): void {
		if (!this.callbacks.hasOwnProperty(event)) {
			this.callbacks[event] = [];
		}
		this.callbacks[event].push(callback);
	}

	private processes: {[key: string]: Function} = {}
	public send(data: string | object) {
		return new Promise((resolve, reject) => {
			// Start a new process, we need to know what the client is answering to, so we assign each message an identifier.
			let id = randomString();
			this.processes[id] = (data: string) => {
				resolve(data)
				delete this.processes[id];
			}

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			data["identifier"] = id,

			(Object.values(this.connections)[0] as WebSocket).send(JSON.stringify(data))
		})
		
	}

	private tryResolvePackage(url: string) {
		// Check if it exists as a node directory.
		let dir = path.join(this.node_dir, url);
		if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
			// Read the package.json and find the "main" script
			let pkg = path.join(dir, "package.json");
			if (fs.existsSync(pkg)) {
				let json = JSON.parse(fs.readFileSync(pkg).toString());
				let main = json["main"];
				// Join the package dir and the main script path, we then get a path to the main script, which we can serve.
				let file = path.join(dir, main);
				if (fs.existsSync(file)) {
					return file;
				}
			}
		}
	}

	public serve(file: string) {
		return new Promise((resolve, reject) => {
			// We need to rewrite imports in the file in order to be accepted by the browser...
			if (fs.existsSync(file)) {
				let content = fs.readFileSync(file, 'utf8').toString();
				content = content.replace(/import(.*)from.*?["'`](.*)["'`]/g, (f, o, t) => {
					let n = this.tryResolvePackage(t);
					return `import${o}from '${n}'`;
				})
				fs.writeFileSync(file, content);

				this.send({
					type: "POST",
					action: "RUN_FILE",
					data: {
						file
					}
				}).then(data => {
					resolve(data)
				})
			} else {
				reject("File does not exist.")
			}
		})
	}
}