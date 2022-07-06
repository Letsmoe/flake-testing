var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { readConfig } from "./config/readConfig.js";
import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { sha256 } from "crypto-hash";
import { ResultPrinter } from "./display/ResultPrinter.js";
import { args, allowExecution } from "./args.js";
import * as http from "http";
import * as ws from "ws";
import * as mime from "mime-types";
import { fileURLToPath } from 'url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var dir = "";
var DirectoryReader = /** @class */ (function () {
    function DirectoryReader(config) {
        this.config = config;
        this.dir = "";
        // If a config was given we take the path from that else we use the current directory
        var configPath = args.config ? path.join(process.cwd(), path.dirname(args.config)) : process.cwd();
        this.dir = path.join(configPath, config.dir);
    }
    /**
     * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
     * @date 6/8/2022 - 11:34:52 PM
     */
    DirectoryReader.prototype.constructFolders = function () {
        var FOLDER_NAME = ".flake";
        var TEMP_FOLDER = path.join(this.dir, FOLDER_NAME);
        // Create the folder if it doesn't exist already.
        if (!fs.existsSync(TEMP_FOLDER)) {
            fs.mkdirSync(TEMP_FOLDER);
        }
        // Now create the subfolders we need to keep everything organized.
        /**
         * The cache folder is where all bundled files will be stored,
         * this will ensure we don't recompile whole projects just because of a single change to a file that didn't even matter to us.
         */
        var CACHE_FOLDER = path.join(TEMP_FOLDER, "cache");
        /**
         * The result folder is where all result files are being stored,
         * their names correspond to their unique job identifiers created through a sha256 hash on the test file.
         */
        var RESULT_FOLDER = path.join(TEMP_FOLDER, "results");
        // Remove the cache folder and create it once again
        if (fs.existsSync(CACHE_FOLDER)) {
            fs.rmSync(CACHE_FOLDER, { recursive: true });
        }
        if (!fs.existsSync(RESULT_FOLDER)) {
            fs.mkdirSync(RESULT_FOLDER);
        }
        fs.mkdirSync(CACHE_FOLDER);
    };
    return DirectoryReader;
}());
var Server = /** @class */ (function () {
    function Server(port) {
        if (port === void 0) { port = 8086; }
        this.instance = http.createServer(this.requestListener.bind(this));
        this.instance.listen(port);
    }
    Server.prototype.requestListener = function (req, res) {
        var p = path.join(__dirname, "../assets/", req.url == "/" ? "index.html" : req.url);
        if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
            var type = mime.lookup(p);
            res.setHeader("Content-Type", type);
            res.writeHead(200);
            var content = fs.readFileSync(p);
            res.end(content);
        }
        else {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end("<h1>Missing files, consider reinstalling.</h1>");
        }
    };
    return Server;
}());
var WSServer = /** @class */ (function () {
    function WSServer(port) {
        if (port === void 0) { port = 8088; }
        this.connections = new Map();
        this.lastPacket = [];
        this.connectionCount = 0;
        this.instance = new ws.WebSocketServer({ port: port });
        this.instance.on("connection", this.connectionReceiver.bind(this));
    }
    WSServer.prototype.onStateChange = function () { };
    WSServer.prototype.connectionReceiver = function (ws) {
        var _this = this;
        this.connectionCount++;
        console.log("Client connected to server.");
        var id = Symbol("id");
        ws.on("message", function (data) {
        });
        ws.on("close", function () {
            _this.connections.delete(id);
            _this.connectionCount--;
            _this.onStateChange();
        });
        ws.onerror = function () {
            console.log("Error occurred in Websocket connection.");
        };
        this.connections.set(id, ws);
        this.onStateChange();
        this.submit(this.lastPacket);
    };
    WSServer.prototype.submit = function (obj) {
        this.lastPacket = obj;
        var data = JSON.stringify({
            type: "POST",
            action: "DISPLAY_RESULT",
            data: obj
        });
        this.connections.forEach(function (connection) {
            connection.send(data);
        });
    };
    return WSServer;
}());
var Connection = /** @class */ (function () {
    function Connection(config, options) {
        var _this = this;
        this.config = config;
        this.contentMap = {};
        this.resultMap = {};
        this.printer = new ResultPrinter();
        this.options = Object.assign({
            displayOnSubmit: true,
            defaultFileExtension: "",
            enableServer: false
        }, options);
        // If a config was given we take the path from that else we use the current directory
        var configPath = args.config ? path.join(process.cwd(), path.dirname(args.config)) : process.cwd();
        this.dir = path.join(configPath, config.dir);
        dir = this.dir;
        this.directory = new DirectoryReader(config);
        this.directory.constructFolders();
        // If requested open a server and a Websocket server to display all results.
        if (this.options.enableServer === true) {
            this.server = new Server();
            this.wsServer = new WSServer();
            this.printer.addHeader("Local server opened: http://localhost:8086;");
            // Reserve a header that can be updated once a client connects to the server.
            var setWsHeader_1 = this.printer.reserveHeader("WebSocket server opened on port 8088; 0 clients connected;");
            this.wsServer.onStateChange = function () {
                setWsHeader_1("WebSocket server opened on port 8088; ".concat(_this.wsServer.connectionCount, " clients connected;"));
            };
        }
    }
    Connection.prototype.submit = function (obj) {
        this.wsServer.submit(obj);
    };
    Connection.prototype.subscribe = function (matcher, callback) {
        var _this = this;
        // Watch the config.dir for file changes, if they match the matcher RegExp call the callback on them.
        chokidar.watch(this.dir).on("all", function (event, file) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, pattern, content, hash_1, submit;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Check if this path should be excluded
                        // Loop through the configs exclude patterns and test against each
                        for (_i = 0, _a = this.config.exclude.concat(".*\\.flake.*"); _i < _a.length; _i++) {
                            pattern = _a[_i];
                            if (new RegExp(pattern).test(file)) {
                                return [2 /*return*/];
                            }
                        }
                        if (!((event === "add" || event === "change") && matcher.test(file))) return [3 /*break*/, 2];
                        content = fs.readFileSync(file);
                        return [4 /*yield*/, sha256(content)];
                    case 1:
                        hash_1 = _b.sent();
                        // Write the hash and file name to our map so we can reference it later.
                        this.contentMap[hash_1] = file;
                        submit = function (content) {
                            // Write the content to storage.
                            var fileName = _this.writeFile(hash_1, content);
                            return fileName;
                        };
                        // Submit the file event to the user;
                        callback(submit, hash_1, content.toString());
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * A function to prepare for the execution and submission of a result.
     * @date 7/3/2022 - 12:53:04 PM
     *
     * @public
     * @param {string} hash
     * @param {((err: Error | null, submitResult: (result: any) => void) => void)} callback
     */
    Connection.prototype.prepare = function (hash, callback) {
        var _this = this;
        if (this.contentMap.hasOwnProperty(hash)) {
            callback(null, function (result) {
                result.inputFile = _this.contentMap[hash];
                // Store the results of the test in the result map and write them to storage.
                _this.resultMap[hash] = result;
                // Write the result map to storage
                fs.writeFileSync(path.join(_this.dir, ".flake", "results", Date.now().toString()), JSON.stringify(_this.resultMap[hash]));
                // Remove the test file from cache
                fs.rmSync(path.join(_this.dir, hash + "." + _this.options.defaultFileExtension));
            });
        }
        else {
            callback(new Error("Hash could not be found in list of files."));
        }
    };
    Connection.prototype.writeFile = function (hash, content) {
        var resultFilePath = path.join(this.dir, hash + "." + this.options.defaultFileExtension);
        fs.writeFileSync(resultFilePath, content, "utf8");
        return resultFilePath;
    };
    return Connection;
}());
var Flake;
(function (Flake) {
    function getConfig(basePath) {
        if (basePath === void 0) { basePath = process.cwd(); }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        readConfig(args.config ? path.join(process.cwd(), path.dirname(args.config)) : basePath).then(function (config) {
                            resolve(config);
                        });
                    })];
            });
        });
    }
    Flake.getConfig = getConfig;
    function connect(config, options) {
        return new Connection(config, options);
    }
    Flake.connect = connect;
    function display(connection) {
        var printer = connection.printer;
        // Read the results directory
        var resultPath = path.join(dir, ".flake", "results");
        var files = fs.readdirSync(resultPath);
        // Get the 10 latest files (we can just sort by filename, because they resemble the capturing dates.)
        files = files.sort(function (a, b) { return parseInt(b) - parseInt(a); });
        var fileArray = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var content = fs.readFileSync(path.join(resultPath, file), "utf-8");
            fileArray.push(JSON.parse(content));
        }
        if (connection.options.enableServer) {
            connection.submit(fileArray);
        }
        printer.print(fileArray);
    }
    Flake.display = display;
})(Flake || (Flake = {}));
export { Flake, allowExecution };
//# sourceMappingURL=flake.js.map