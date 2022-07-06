import { FlakeConfigObject } from "./config/config.type";
import { readConfig } from "./config/readConfig.js";
import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { sha256 } from "crypto-hash";
import { ResultPrinter } from "./display/ResultPrinter.js";
import { args, allowExecution } from "./args.js"
import * as http from "http";
import * as ws from "ws";
import { OutputObject } from "./types/OutputObject";
import * as mime from "mime-types";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var dir = "";

class DirectoryReader {
	private dir: string = "";

	constructor(private config: FlakeConfigObject) {
		// If a config was given we take the path from that else we use the current directory
		let configPath = args.config ? path.join(process.cwd(), path.dirname(args.config)) : process.cwd();

		this.dir = path.join(configPath, config.dir);
	}

	/**
	 * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
	 * @date 6/8/2022 - 11:34:52 PM
	 */
	public constructFolders() {
		const FOLDER_NAME = ".flake";
		const TEMP_FOLDER = path.join(this.dir, FOLDER_NAME);
		// Create the folder if it doesn't exist already.
		if (!fs.existsSync(TEMP_FOLDER)) {
			fs.mkdirSync(TEMP_FOLDER);
		}

		// Now create the subfolders we need to keep everything organized.
		/**
		 * The cache folder is where all bundled files will be stored,
		 * this will ensure we don't recompile whole projects just because of a single change to a file that didn't even matter to us.
		 */
		const CACHE_FOLDER = path.join(TEMP_FOLDER, "cache");

		/**
		 * The result folder is where all result files are being stored,
		 * their names correspond to their unique job identifiers created through a sha256 hash on the test file.
		 */
		const RESULT_FOLDER = path.join(TEMP_FOLDER, "results");
		// Remove the cache folder and create it once again
		if (fs.existsSync(CACHE_FOLDER)) {
			fs.rmSync(CACHE_FOLDER, { recursive: true });
		}
		if (!fs.existsSync(RESULT_FOLDER)) {
			fs.mkdirSync(RESULT_FOLDER);
		}
		fs.mkdirSync(CACHE_FOLDER);
	}
}

interface ConnectionOptions {
	displayOnSubmit?: boolean;
	defaultFileExtension?: string;
	enableServer?: boolean;
}


class Server {
	private instance: http.Server;
	constructor(port: number = 8086) {
		this.instance = http.createServer(this.requestListener.bind(this));
		this.instance.listen(port);
	}

	public requestListener(req: http.IncomingMessage, res: http.ServerResponse) {
		let p = path.join(__dirname, "../assets/", req.url == "/" ? "index.html" : req.url);
		if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
			let type = mime.lookup(p) as string
			res.setHeader("Content-Type", type);
			res.writeHead(200);
			let content = fs.readFileSync(p);
			res.end(content);
		} else {
			res.setHeader("Content-Type", "text/html");
			res.writeHead(200)
			res.end("<h1>Missing files, consider reinstalling.</h1>")
		}
	}
}

class WSServer {
	private instance: ws.WebSocketServer;
	private connections: Map<Symbol, ws.WebSocket> = new Map<Symbol, ws.WebSocket>();
	private lastPacket: OutputObject[] = [];
	public connectionCount: number = 0;

	constructor(port: number = 8088) {
		this.instance = new ws.WebSocketServer({ port });
		this.instance.on("connection", this.connectionReceiver.bind(this));
	}

	public onStateChange() {}

	private connectionReceiver(ws: ws.WebSocket) {
		this.connectionCount++
		console.log("Client connected to server.");
		let id = Symbol("id");
		
		ws.on("message", (data) => {

		})

		ws.on("close", () => {
			this.connections.delete(id);
			this.connectionCount--
			this.onStateChange()
		})

		ws.onerror = () => {
			console.log("Error occurred in Websocket connection.")
		}

		this.connections.set(id, ws);
		this.onStateChange()
		this.submit(this.lastPacket);
	}

	public submit(obj: OutputObject[]) {
		this.lastPacket = obj;
		let data = JSON.stringify({
			type: "POST",
			action: "DISPLAY_RESULT",
			data: obj
		});
		this.connections.forEach(connection => {
			connection.send(data);
		})
	}
}

class Connection {
	private server?: Server;
	private wsServer?: WSServer;
	public options: ConnectionOptions;
	private contentMap: { [key: string]: string } = {};
	private resultMap: {[key: string]: any} = {};
	private dir: string;
	private directory: DirectoryReader;
	public printer: ResultPrinter = new ResultPrinter();

	constructor(private config: FlakeConfigObject, options: ConnectionOptions) {
		this.options = Object.assign({
			displayOnSubmit: true,
			defaultFileExtension: "",
			enableServer: false
		}, options);

		// If a config was given we take the path from that else we use the current directory
		let configPath = args.config ? path.join(process.cwd(), path.dirname(args.config)) : process.cwd();

		this.dir = path.join(configPath, config.dir);
		dir = this.dir;
		this.directory = new DirectoryReader(config);
		this.directory.constructFolders()


		// If requested open a server and a Websocket server to display all results.
		if (this.options.enableServer === true) {
			this.server = new Server();
			this.wsServer = new WSServer();

			this.printer.addHeader("Local server opened: http://localhost:8086;");
			// Reserve a header that can be updated once a client connects to the server.
			let setWsHeader = this.printer.reserveHeader("WebSocket server opened on port 8088; 0 clients connected;")
			this.wsServer.onStateChange = () => {
				setWsHeader(`WebSocket server opened on port 8088; ${this.wsServer.connectionCount} clients connected;`)
			}
		}
	}

	public submit(obj: OutputObject[]) {
		this.wsServer.submit(obj)
	}

	public subscribe(matcher: RegExp, callback: Flake.ConnectionCallback) {
		// Watch the config.dir for file changes, if they match the matcher RegExp call the callback on them.
		chokidar.watch(this.dir).on("all", async (event, file) => {
			// Check if this path should be excluded
			// Loop through the configs exclude patterns and test against each
			for (const pattern of this.config.exclude.concat(".*\\.flake.*")) {
				if (new RegExp(pattern).test(file)) {
					return
				}
			}
			if ((event === "add" || event === "change") && matcher.test(file)) {
				// Read the file content;
				let content = fs.readFileSync(file);
				// Create a hash on the file content and store it in the map
				let hash = await sha256(content);
				// Write the hash and file name to our map so we can reference it later.
				this.contentMap[hash] = file;
				// Create a submit function that will receive a rewritten form of that file.
				const submit = (content: string) => {
					// Write the content to storage.
					let fileName = this.writeFile(hash, content);
					return fileName;
				};
				// Submit the file event to the user;
				callback(submit, hash, content.toString());
			}
		});
	}

	/**
	 * A function to prepare for the execution and submission of a result.
	 * @date 7/3/2022 - 12:53:04 PM
	 *
	 * @public
	 * @param {string} hash
	 * @param {((err: Error | null, submitResult: (result: any) => void) => void)} callback
	 */
	public prepare(hash: string, callback: (err: Error | null, submitResult?: (result: any) => void) => void): void {
		if (this.contentMap.hasOwnProperty(hash)) {
			callback(null, (result: any) => {
				result.inputFile = this.contentMap[hash];
				// Store the results of the test in the result map and write them to storage.
				this.resultMap[hash] = result
				// Write the result map to storage
				fs.writeFileSync(path.join(this.dir, ".flake", "results", Date.now().toString()), JSON.stringify(this.resultMap[hash]));
				// Remove the test file from cache
				fs.rmSync(path.join(this.dir, hash + "." + this.options.defaultFileExtension));
			})
		} else {
			callback(new Error("Hash could not be found in list of files."))
		}
	}

	private writeFile(hash: string, content: string): string {
		let resultFilePath = path.join(this.dir, hash + "." + this.options.defaultFileExtension);
		fs.writeFileSync(resultFilePath, content, "utf8");
		return resultFilePath;
	}
}

namespace Flake {
	export async function getConfig(basePath: string = process.cwd()): Promise<FlakeConfigObject> {
		return new Promise((resolve, reject) => {
			readConfig(args.config ? path.join(process.cwd(), path.dirname(args.config)) : basePath).then((config) => {
				resolve(config);
			});
		});
	}

	export function connect(config: FlakeConfigObject, options: ConnectionOptions) {
		return new Connection(config, options);
	}

	export function display(connection: Connection) {
		let printer = connection.printer;
		// Read the results directory
		let resultPath = path.join(dir, ".flake", "results");
		let files = fs.readdirSync(resultPath);

		// Get the 10 latest files (we can just sort by filename, because they resemble the capturing dates.)
		files = files.sort((a,b) => parseInt(b)-parseInt(a));
		let fileArray = [];
		for (let i = 0; i < files.length; i++) {
			let file = files[i];
			let content = fs.readFileSync(path.join(resultPath, file), "utf-8")
			fileArray.push(JSON.parse(content));
		}

		if (connection.options.enableServer) {
			connection.submit(fileArray);
		}

		printer.print(fileArray)
	}

	export type SubmitFunction = (content: string) => string;

	export type ConnectionCallback = (
		submit: Flake.SubmitFunction,
		hash: string,
		content: string
	) => void;
}

export { Flake, allowExecution };
