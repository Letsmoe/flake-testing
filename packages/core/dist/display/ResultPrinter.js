import * as fs from "fs";
import { c } from "./color.js";
import boxen from "boxen";
import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { generateRandomString } from "../utils/randomString.js";
var ResultPrinter = /** @class */ (function () {
    function ResultPrinter() {
        this.headers = { "0": "Running flake version 0.0.1;" };
        // A number to store the current index in, this allows navigating results.
        this.currentIndex = 0;
        this.readListeners = [];
    }
    ResultPrinter.prototype.formatResultInfo = function (obj) {
        var numAssertions = obj.result.assertions.length;
        var _a = [obj.result.groups, Object.keys(obj.result.groups).length], groups = _a[0], numGroups = _a[1];
        // Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
        var groupMap = {};
        for (var _i = 0, _b = Object.keys(groups); _i < _b.length; _i++) {
            var group = _b[_i];
            for (var _c = 0, _d = groups[group]; _c < _d.length; _c++) {
                var assertion = _d[_c];
                groupMap[assertion] = group;
            }
        }
        var groupResults = {};
        var arrAssertions = obj.result.assertions;
        var _e = arrAssertions.reduce(function (acc, curr) {
            if (groupMap[curr.name]) {
                if (!groupResults[groupMap[curr.name]]) {
                    groupResults[groupMap[curr.name]] = {
                        failed: 0,
                        total: 0
                    };
                }
                if (!curr.result) {
                    groupResults[groupMap[curr.name]].failed++;
                }
                groupResults[groupMap[curr.name]].total++;
            }
            if (curr.result === true) {
                return [acc[0], acc[1] + 1];
            }
            else {
                return [acc[0] + 1, acc[1]];
            }
        }, [0, 0]), failed = _e[0], succeeded = _e[1];
        var ratio = (succeeded / numAssertions * 100);
        var info = [
            [c.yellow("Groups"), numGroups],
            [c.yellow("Assertions"), numAssertions],
            [c.yellow("Failed"), failed],
            [c.yellow("Succeeded"), succeeded],
            [c.yellow("Snapshots"), obj.snapshots.length],
            [c.yellow("Time"), "".concat(obj.endTime - obj.startTime, "ms")],
            [c.yellow("Ratio"), ratio > 50 ? c.bg.green("".concat(ratio.toFixed(1), "%")) : c.bg.red("".concat(ratio.toFixed(1), "%"))],
        ];
        var maxKeyLength = info.reduce(function (acc, curr) {
            return Math.max(acc, curr[0].length);
        }, 0);
        var output = info.map(function (curr) {
            var key = curr[0];
            var value = curr[1];
            var padding = maxKeyLength - key.length;
            return "".concat(key).concat(new Array(padding + 1).join(" "), ": ").concat(value);
        }).join("\n");
        for (var name_1 in groupResults) {
            var result = groupResults[name_1];
            if (result.failed === result.total) {
                output += "\n".concat(c.yellow("".concat(c.blue(name_1))), ": ").concat(c.red("Failed ".concat(result.failed, "/").concat(result.total)));
            }
            else {
                output += "\n".concat(c.blue(name_1), ": Failed ").concat(result.failed, "/").concat(result.total);
            }
        }
        return output;
    };
    ResultPrinter.prototype.formatHeader = function () {
        return Object.values(this.headers).map(function (x) {
            return "  " + x.trim();
        }).join("\n");
    };
    ResultPrinter.prototype.addHeader = function (message) {
        var id = generateRandomString(16);
        this.headers[id] = message;
    };
    ResultPrinter.prototype.reserveHeader = function (message) {
        var _this = this;
        var id = generateRandomString(16);
        this.headers[id] = message;
        return function (msg) {
            _this.headers[id] = msg;
            _this.printMain();
        };
    };
    ResultPrinter.prototype.print = function (result) {
        this.result = result;
        this.printMain();
    };
    ResultPrinter.prototype.closeAllListeners = function () {
        this.readListeners.forEach(function (listener) {
            listener.close();
        });
    };
    ResultPrinter.prototype.printMain = function () {
        this.closeAllListeners();
        var currentResult = this.result[this.currentIndex];
        this.margin = 0.5;
        console.clear();
        console.log(this.formatHeader());
        var text = "";
        text += this.formatAssertions(currentResult) + "\n";
        text += this.formatResultInfo(currentResult);
        console.log(boxen(text, { title: "Page ".concat(this.currentIndex + 1, " of ").concat(this.result.length), titleAlignment: "left", padding: { top: 1, left: 1.5, right: 1.5, bottom: 1 }, margin: this.margin, width: 100 }));
        this.showOptionsList("main");
    };
    ResultPrinter.prototype.formatSnapshots = function (obj) {
        var _this = this;
        console.clear();
        var TAB = " ".repeat(6);
        var TAB_SM = " ".repeat(3);
        var snapshots = obj.snapshots;
        var startTime = obj.startTime;
        var endTime = obj.endTime;
        // Loop through all the snapshots and list when they were captured as well as on which line they were captured.
        var i = 0;
        var text = "";
        for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
            var snapshot = snapshots_1[_i];
            text += "".concat(c.yellow("Snapshot (".concat(i, ")")), ":\n");
            text += "".concat(TAB_SM).concat(c.yellow("Line"), ": ").concat(snapshot.event.line, "\n");
            text += "".concat(TAB_SM).concat(c.yellow("Name"), ": \"").concat(snapshot.event.name, "\"\n");
            i++;
        }
        console.log(boxen(text, { title: "Page ".concat(this.currentIndex + 1, " of ").concat(this.result.length), titleAlignment: "left", padding: { top: 1, left: 1.5, right: 1.5, bottom: 1 }, margin: this.margin, width: 100 }));
        var _a = readString("  What snapshot do you want to inspect:", function (str) {
            return parseInt(str, 10) >= 0 && parseInt(str, 10) < snapshots.length;
        }), rl = _a[0], answer = _a[1];
        this.readListeners.push(rl);
        answer.then(function (answer) {
            console.clear();
            var snapshotNumber = parseInt(answer);
            var snapshot = snapshots[snapshotNumber];
            var relativeTime = snapshot.time - startTime;
            var text = "";
            // Dump the entire scope
            text += "".concat(c.bg.green("Scope"), ":\n");
            for (var key in snapshot.scope) {
                var value = snapshot.scope[key];
                text += "".concat(TAB_SM).concat(c.yellow(key), ": ").concat(JSON.stringify(value), "\n");
            }
            // Print information about the assignment that has taken place there.
            text += "".concat(c.yellow("Snapshot (".concat(snapshotNumber, ")")), ":\n");
            text += "".concat(TAB_SM).concat(c.yellow("Time Recorded"), ": ").concat(relativeTime, "ms after start.\n");
            text += "".concat(TAB_SM).concat(c.yellow("Line"), ": ").concat(snapshot.event.line, "\n");
            text += "".concat(TAB_SM).concat(c.yellow("Assignment Type"), ": ").concat(snapshot.event.type, "\n");
            text += "".concat(TAB_SM).concat(c.yellow("Name"), ": \"").concat(snapshot.event.name, "\"\n");
            text += "".concat(TAB_SM).concat(c.yellow("Value"), ": ").concat(JSON.stringify(snapshot.event.value), "\n");
            // Print the contextual lines of the file.
            var line = snapshot.event.line;
            var lines = fs.readFileSync(obj.inputFile).toString().split("\n");
            var followingLines = lines.slice(line - 5, line + 4);
            for (var _i = 0, _a = Object.entries(followingLines); _i < _a.length; _i++) {
                var _b = _a[_i], lineNumber = _b[0], line_1 = _b[1];
                var correctedLine = parseInt(lineNumber, 10) + snapshot.event.line - 5;
                if (correctedLine === snapshot.event.line - 1) {
                    text += "".concat(TAB_SM).concat(c.red(">> ".concat(correctedLine + 1, "|"))).concat(TAB_SM).concat(line_1, "\n");
                }
                else {
                    text += "".concat(TAB).concat(correctedLine + 1, "|").concat(TAB_SM).concat(line_1, "\n");
                }
            }
            console.log(boxen(text, { title: "Page ".concat(_this.currentIndex + 1, " of ").concat(_this.result.length), titleAlignment: "left", padding: { top: 1, left: 1.5, right: 1.5, bottom: 1 }, margin: _this.margin, width: 100 }));
            _this.showOptionsList("");
        });
    };
    ResultPrinter.prototype.showOptionsList = function (current) {
        var _this = this;
        var indent = " ".repeat(Math.round(this.margin * 4));
        if (current !== "snapshots")
            console.log(indent + "> Press [".concat(c.bold("S"), "] to get a list of all captured snapshots."));
        if (current !== "main")
            console.log(indent + "> Press [".concat(c.bold("R"), "] to return to the main window."));
        if (current === "main" && this.result.length > 1)
            console.log(indent + "> Press [".concat(c.bold("LEFT"), "] to navigate to the previous run or [").concat(c.bold("RIGHT"), "] for the next run."));
        console.log(indent + "> Press [".concat(c.bold("E"), "] to exit the debugger."));
        var _a = readChar(indent + "What would you like to do?\n" + indent, function (char, key) {
            return ["s", "r", "e"].indexOf(char) > -1 || ["right", "left"].indexOf(key.name) > -1 && _this.result.length > 1;
        }), rl = _a[0], answer = _a[1];
        this.readListeners.push(rl);
        answer.then(function (_a) {
            var char = _a.char, event = _a.event;
            if (char === "s") {
                _this.formatSnapshots(_this.result[_this.currentIndex]);
            }
            else if (char === "r") {
                _this.printMain();
            }
            else if (char === "e") {
                process.exit(0);
            }
            else if (event.name === "left" && _this.result.length > 1) {
                _this.currentIndex = (_this.currentIndex - 1) < 0 ? _this.result.length - 1 : _this.currentIndex - 1;
                _this.printMain();
            }
            else if (event.name === "right" && _this.result.length > 1) {
                _this.currentIndex = (_this.currentIndex + 1) >= _this.result.length ? 0 : _this.currentIndex + 1;
                _this.printMain();
            }
        });
    };
    ResultPrinter.prototype.formatAssertions = function (obj) {
        var output = "";
        var TAB = " ".repeat(6);
        var TAB_SM = " ".repeat(3);
        // Loop through all the assertions and check if they're in a group.
        // If they are, print the group name and the assertion.
        // If they aren't, print the assertion.
        var file = obj.inputFile;
        var groups = obj.result.groups;
        // Remap the groups from {"main": [0,1]} to {"0": "main", "1": "main"};
        var groupMap = {};
        for (var _i = 0, _a = Object.keys(groups); _i < _a.length; _i++) {
            var group = _a[_i];
            for (var _b = 0, _c = groups[group]; _b < _c.length; _b++) {
                var assertion = _c[_b];
                groupMap[assertion] = group;
            }
        }
        // Store all assertions
        var assertions = Object.values(obj.result.assertions);
        for (var _d = 0, assertions_1 = assertions; _d < assertions_1.length; _d++) {
            var assertion = assertions_1[_d];
            var name_2 = assertion.name;
            // If the assertion passed we want to write a "PASS" sign with green background
            // If the assertion failed we want to write a "FAIL" sign with red background
            var color = assertion.result ? c.bg.green : c.bg.red;
            var sign = assertion.result ? "PASS" : "FAIL";
            // Remove the path of the config from the filepath since we don't want to list literally the whole thing.
            var replacedFile = file.replace(process.cwd(), "");
            output += groupMap[name_2] ? "".concat(c.blue(groupMap[name_2]), ": ") : "";
            output += color(sign) + " " + "".concat(replacedFile, ":").concat(assertion.line) + "\n";
            if (assertion.description)
                output += TAB + assertion.description + "\n";
            output += "".concat(TAB).concat(c.blue("content"), ": ").concat(c.yellow(assertion.content), "\n\n");
            // If the assertion failed, we want to print the line where it failed and the following 5 lines;
            if (!assertion.result) {
                var lines = fs.readFileSync(file).toString().split("\n");
                var followingLines = lines.slice(assertion.line - 3, assertion.line + 4);
                for (var _e = 0, _f = Object.entries(followingLines); _e < _f.length; _e++) {
                    var _g = _f[_e], lineNumber = _g[0], line = _g[1];
                    var correctedLine = parseInt(lineNumber, 10) + assertion.line - 3;
                    var strLine = (correctedLine + 1).toString().padStart(2, " ");
                    if (correctedLine === assertion.line - 1) {
                        output += "".concat(TAB_SM).concat(c.red(">> ".concat(strLine, "|"))).concat(TAB_SM).concat(c.red(line), "\n");
                    }
                    else {
                        output += "".concat(TAB).concat(strLine, "|").concat(TAB_SM).concat(line, "\n");
                    }
                }
                output += "\n";
            }
        }
        return output;
    };
    return ResultPrinter;
}());
function readChar(message, verify) {
    if (verify === void 0) { verify = function (char, key) { return true; }; }
    var ac = new AbortController();
    var signal = ac.signal;
    var rl = readline.createInterface({ input: input, output: output });
    return [rl, new Promise(function (resolve, reject) {
            var listener = function (char, k) {
                if (verify(char, k)) {
                    var closeListener = function () {
                        resolve({ char: char, event: k });
                    };
                    rl.on("close", closeListener);
                    process.stdin.removeListener("keypress", listener);
                    ac.abort();
                    rl.close();
                }
                else {
                    readline.clearLine(process.stdout, 0);
                    readline.moveCursor(process.stdout, -1, 0);
                }
            };
            process.stdin.on("keypress", listener);
            rl.question(message, { signal: signal }, function () { });
        })];
}
function readString(message, verify) {
    if (verify === void 0) { verify = function (str) { return true; }; }
    var rl = readline.createInterface({ input: input, output: output });
    return [rl, new Promise(function (resolve, reject) {
            rl.question(message, function (answer) {
                rl.close();
                if (verify(answer)) {
                    resolve(answer);
                }
                else {
                    readString(message, verify);
                }
            });
        })];
}
export { ResultPrinter };
//# sourceMappingURL=ResultPrinter.js.map