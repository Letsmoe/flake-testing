#!/usr/bin/env node
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
import * as fs from "fs";
import { ResultPrinter } from "../display/ResultPrinter.js";
import { error, Properties, Reasons } from "../shared.js";
import * as path from "path";
import { AttachDirectoryWatcher, ScanDirectory } from "../DirectoryWatcher.js";
import { getUtils } from "../ModuleUtils.js";
import getPort from "get-port";
import Server from "../Server.js";
import WebSocketServer from "../WebSocketServer.js";
import { spawn } from "node:child_process";
import { args } from "./Args.js";
import { DEFAULT_LOADERS } from "../Loaders.js";
var configPath = path.join(process.cwd(), args.config);
var configFolder = path.dirname(configPath);
// Read the config file
var config = JSON.parse(fs.readFileSync(configPath).toString());
config.exclude = config.exclude || [];
config.exclude = config.exclude.concat([".*\\.flake.*"]);
// The directory containing all test files, we can just use the config directory since it points to the dir folder.
var dir = path.join(configFolder, config.dir);
(function () {
    var _this = this;
    // Get a list of all rules we might want to follow.
    var rules = this.config.rules || [];
    if (this.config.useDefaultLoaders) {
        rules.push.apply(rules, DEFAULT_LOADERS);
    }
    /**
     * Create all folders for storing results
     */
    var FOLDER_NAME = ".flake";
    var TEMP_FOLDER = path.join(dir, FOLDER_NAME);
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
    /**
     * Check whether the directory should be watched, if the CLI option is true we just ignore the config.
     */
    var watch = args.watch === false ? false : (this.config.watch || args.watch);
    if (watch === true) {
        // Watch the directory for changes (deep).
        AttachDirectoryWatcher(this.dir, function (eventType, file) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (eventType === "add" || eventType === "change") {
                    SubmitFileChange(file, file.replace(this.dir, ""), rules).then(function (result) {
                        WriteResult(_this.dir, result);
                        submit(getResultArray());
                    })
                        .catch(function () { });
                }
                return [2 /*return*/];
            });
        }); });
    }
    else {
        // Loop through all files in the directory (maybe deeply) and submit all files once.
        ScanDirectory(this.dir, this.dir).forEach(function (_a) {
            var absFile = _a[0], file = _a[1];
            return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_b) {
                    SubmitFileChange(absFile, file, rules)
                        .then(function (result) {
                        WriteResult(_this.dir, result);
                        submit(getResultArray());
                    })
                        .catch(function (err) {
                        console.log(err);
                    });
                    return [2 /*return*/];
                });
            });
        });
    }
    var printer = new ResultPrinter();
    var submit = function (files) {
        _this.wsServer.submit(files);
        printer.print(files);
    };
    var getResultArray = function () {
        var resultPath = path.join(_this.dir, ".flake", "results");
        var files = fs.readdirSync(resultPath);
        // Get the 10 latest files (we can just sort by filename, because they resemble the capturing dates.)
        files = files.sort(function (a, b) { return parseInt(b) - parseInt(a); });
        var fileArray = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var content = fs.readFileSync(path.join(resultPath, file), "utf-8");
            fileArray.push(JSON.parse(content));
        }
        return fileArray;
    };
    //if (config.localServer) {
    (function () { return __awaiter(_this, void 0, void 0, function () {
        function exitHandler(options, exitCode) {
            console.log("Shutting down server.");
            this.server.close();
            this.wsServer.close();
            if (exitCode || exitCode === 0)
                console.log(exitCode);
            if (options.exit)
                process.exit();
        }
        var WebServerPort, WebSocketServerPort, setWsHeader;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPort()];
                case 1:
                    WebServerPort = _a.sent();
                    return [4 /*yield*/, getPort()];
                case 2:
                    WebSocketServerPort = _a.sent();
                    this.server = new Server(WebServerPort, WebSocketServerPort);
                    this.wsServer = new WebSocketServer(WebSocketServerPort);
                    this.wsServer.root = this.dir;
                    //do something when app is closing
                    process.on('exit', exitHandler.bind(this, { cleanup: true }));
                    //catches ctrl+c event
                    process.on('SIGINT', exitHandler.bind(this, { exit: true }));
                    // catches "kill pid" (for example: nodemon restart)
                    process.on('SIGUSR1', exitHandler.bind(this, { exit: true }));
                    process.on('SIGUSR2', exitHandler.bind(this, { exit: true }));
                    //catches uncaught exceptions
                    process.on('uncaughtException', exitHandler.bind(this, { exit: true }));
                    this.wsServer.onMessage("REMOVE_ALL", function () {
                        var files = fs.readdirSync(path.join(dir, ".flake", "results"));
                        files.forEach(function (file) {
                            var p = path.join(dir, "/.flake/results/", file);
                            if (fs.existsSync(p)) {
                                fs.rmSync(p);
                            }
                        });
                        submit([]);
                    });
                    this.wsServer.onMessage("RUN_ALL", function () {
                        ScanDirectory(_this.dir, _this.dir).forEach(function (_a) {
                            var absFile = _a[0], file = _a[1];
                            return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_b) {
                                    SubmitFileChange(absFile, file, rules)
                                        .then(function (result) {
                                        WriteResult(_this.dir, result);
                                        submit(getResultArray());
                                    })
                                        .catch(function () { });
                                    return [2 /*return*/];
                                });
                            });
                        });
                    });
                    this.wsServer.onMessage("OPEN_FILE", function (data) {
                        // Check if vscode is installed, then we can open at the specified line
                        if (data.hasOwnProperty("line") && data.hasOwnProperty("column")) {
                            var vsVersion = spawn("code", ["--version"]);
                            vsVersion.on("close", function (code) {
                                if (code === 0) {
                                    // VSCode is installed, open the file with that.
                                    spawn("code", ["--goto", "".concat(data.file, ":").concat(data.line, ":").concat(data.column)]);
                                }
                                else {
                                    open(data.file);
                                }
                            });
                        }
                        else {
                            open(data.file);
                        }
                    });
                    printer.addHeader("Local server opened: http://localhost:".concat(WebServerPort));
                    setWsHeader = printer.reserveHeader("WebSocket server opened on port ".concat(WebSocketServerPort, "; 0 clients connected;"));
                    this.wsServer.onStateChange = function () {
                        setWsHeader("WebSocket server opened on port ".concat(WebSocketServerPort, "; ").concat(_this.wsServer.connectionCount, " clients connected;"));
                    };
                    return [2 /*return*/];
            }
        });
    }); })();
    //}
}.bind({
    config: config,
    dir: dir,
})());
function WriteResult(dir, result) {
    fs.writeFileSync(path.join(dir, ".flake", "results", Date.now().toString()), JSON.stringify(result));
}
function SubmitFileChange(absFile, relFile, rules) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    if (fs.lstatSync(absFile).isFile()) {
                        for (var i = 0; i < config.exclude.length; i++) {
                            var exclude = new RegExp(config.exclude[i]);
                            if (exclude.test(relFile)) {
                                return;
                            }
                        }
                        // Loop through all rules to find a matching one for each file.
                        for (var i = 0; i < rules.length; i++) {
                            var rule = rules[i];
                            var test = new RegExp(rule.test);
                            if (!test.test(relFile)) {
                                // The test failed, let's continue to the next rule.
                                continue;
                            }
                            var _loop_1 = function (j) {
                                var task = rule.use[j];
                                if (task.loader) {
                                    // A loader is defined, let's follow the specified package, meaning we import it and run the default function.
                                    import(task.loader)
                                        .then(function (module) { return __awaiter(_this, void 0, void 0, function () {
                                        var settings, utils, newPath, addFileExtension;
                                        return __generator(this, function (_a) {
                                            settings = {};
                                            settings[Properties.DEFAULT_FILE_EXTENSION] = "";
                                            if (!module.default) {
                                                error("A loader must export a default function!");
                                            }
                                            utils = getUtils.bind({
                                                config: config,
                                                options: task.options,
                                                dir: dir,
                                                absolutePath: absFile,
                                                relativePath: relFile,
                                            })();
                                            newPath = path.join(dir, path.dirname(relFile), Math.random().toString());
                                            addFileExtension = function (p, ext) {
                                                if (ext) {
                                                    return p + "." + ext;
                                                }
                                                return p;
                                            };
                                            utils.submit = function (rewritten) {
                                                newPath = addFileExtension(newPath, settings[Properties.DEFAULT_FILE_EXTENSION]);
                                                fs.writeFileSync(newPath, rewritten);
                                                return newPath;
                                            };
                                            utils.set = function (option, value) {
                                                settings[option] = value;
                                            };
                                            utils.get = function (option) {
                                                return settings[option];
                                            };
                                            utils.getFile = function () {
                                                return absFile;
                                            };
                                            module.default
                                                .bind(utils)()
                                                .then(function (result) {
                                                result = ManageResult(result, absFile);
                                                if (utils.get(Properties.USE_REWRITE)) {
                                                    fs.rmSync(newPath);
                                                }
                                                resolve(result);
                                            })
                                                .catch(function (err) {
                                                if (err == Reasons.JSON_PARSE_ERROR) {
                                                    console.error("Error parsing returned JSON, tests might not have returned properly.");
                                                }
                                                if (utils.get(Properties.USE_REWRITE)) {
                                                    fs.rmSync(newPath);
                                                }
                                                reject();
                                            });
                                            return [2 /*return*/];
                                        });
                                    }); })
                                        .catch(function (err) {
                                        console.error("Importing loader '" +
                                            task.loader +
                                            "' failed: " +
                                            err);
                                    });
                                }
                            };
                            // Loop through all tasks defined for this rule.
                            for (var j = 0; j < rule.use.length; j++) {
                                _loop_1(j);
                            }
                        }
                    }
                })];
        });
    });
}
function ManageResult(result, origin) {
    result.inputFile = origin;
    // Add context to all failed tests
    var fileContent = fs.readFileSync(origin, "utf-8");
    var lines = fileContent.split("\n");
    var getContext = function (line) {
        var contextLines = {};
        // We can't get any information about what lines we're looking at if we hit the end of the file, so we have to reorder the lines into an object ({line: content})
        for (var i = 0; i < lines.length; i++) {
            if (i >= line - 3 &&
                i <= line + 3) {
                contextLines[i] = lines[i];
            }
        }
        return contextLines;
    };
    result.result.assertions.forEach(function (assertion) {
        // Get the line and add context from the lines around it.
        assertion.context = getContext(assertion.line);
    });
    result.snapshots.forEach(function (snapshot) {
        // Get the line and add context from the lines around it.
        snapshot.context = getContext(snapshot.event.line);
    });
    return result;
}
//# sourceMappingURL=index.js.map