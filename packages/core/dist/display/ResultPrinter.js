import * as input from "wait-console-input";
import * as fs from "fs";
var Reset = "\x1b[0m";
var Bright = "\x1b[1m";
var Dim = "\x1b[2m";
var Underscore = "\x1b[4m";
var Blink = "\x1b[5m";
var Reverse = "\x1b[7m";
var Hidden = "\x1b[8m";
var FgBlack = "\x1b[30m";
var FgRed = "\x1b[31m";
var FgGreen = "\x1b[32m";
var FgYellow = "\x1b[33m";
var FgBlue = "\x1b[34m";
var FgMagenta = "\x1b[35m";
var FgCyan = "\x1b[36m";
var FgWhite = "\x1b[37m";
var BgBlack = "\x1b[40m";
var BgRed = "\x1b[41m";
var BgGreen = "\x1b[42m";
var BgYellow = "\x1b[43m";
var BgBlue = "\x1b[44m";
var BgMagenta = "\x1b[45m";
var BgCyan = "\x1b[46m";
var BgWhite = "\x1b[47m";
var c = /** @class */ (function () {
    function c() {
    }
    c.yellow = function (m) { return FgYellow + m + Reset; };
    c.red = function (m) { return FgRed + m + Reset; };
    c.green = function (m) { return FgGreen + m + Reset; };
    c.blue = function (m) { return FgBlue + m + Reset; };
    c.magenta = function (m) { return FgMagenta + m + Reset; };
    c.cyan = function (m) { return FgCyan + m + Reset; };
    c.white = function (m) { return FgWhite + m + Reset; };
    c.black = function (m) { return FgBlack + m + Reset; };
    c.bold = function (m) { return Bright + m + Reset; };
    c.dim = function (m) { return Dim + m + Reset; };
    c.underscore = function (m) { return Underscore + m + Reset; };
    c.blink = function (m) { return Blink + m + Reset; };
    c.reverse = function (m) { return Reverse + m + Reset; };
    c.hidden = function (m) { return Hidden + m + Reset; };
    c.bgGreen = function (m) { return BgGreen + m + Reset; };
    c.bgRed = function (m) { return BgRed + m + Reset; };
    return c;
}());
var ResultPrinter = /** @class */ (function () {
    function ResultPrinter(pipe) {
        this.pipe = pipe;
        pipe.attach(function (eventName, filePath) {
            console.log("".concat(eventName, ": ").concat(filePath));
        });
    }
    ResultPrinter.prototype.formatResultInfo = function (r) {
        var numAssertions = Object.keys(r.result.assertions).length;
        var _a = [r.result.groups, Object.keys(r.result.groups).length], groups = _a[0], numGroups = _a[1];
        var arrAssertions = Object.values(r.result.assertions);
        var _b = arrAssertions.reduce(function (acc, curr) {
            if (curr.result === true) {
                return [acc[0], acc[1] + 1];
            }
            else {
                return [acc[0] + 1, acc[1]];
            }
        }, [0, 0]), failed = _b[0], succeeded = _b[1];
        var info = [
            [c.yellow("Groups"), numGroups],
            [c.yellow("Assertions"), numAssertions],
            [c.red("Failed"), failed],
            [c.green("Succeeded"), succeeded],
            [c.yellow("Snapshots"), r.snapshots.length],
            [c.yellow("Time"), "".concat(r.endTime - r.startTime, "ms")]
        ];
        var maxKeyLength = info.reduce(function (acc, curr) {
            return Math.max(acc, curr[0].length);
        }, 0);
        return info.map(function (curr) {
            var key = curr[0];
            var value = curr[1];
            var padding = maxKeyLength - key.length;
            return "".concat(key).concat(new Array(padding + 1).join(" "), ": ").concat(value);
        }).join("\n");
    };
    ResultPrinter.prototype.formatHeader = function () {
        return "Running flake version 0.0.1;";
    };
    ResultPrinter.prototype.print = function (identifier) {
        var channel = this.pipe.getChannel(identifier);
        if (channel) {
            var result = channel.asJSON();
            console.log(this.formatHeader());
            console.log(this.formatAssertions(result, channel));
            console.log(this.formatResultInfo(result));
            console.log();
            var char = input.readChar("> Press ".concat(c.bold("s"), " to get a list of all captured snapshots.\n"));
            if (char === "s") {
                console.clear();
                console.log(this.formatSnapshots(result));
            }
        }
    };
    ResultPrinter.prototype.formatSnapshots = function (r) {
        var TAB = " ".repeat(6);
        var TAB_SM = " ".repeat(3);
        var snapshots = r.snapshots;
        var startTime = r.startTime;
        var endTime = r.endTime;
        // Loop through all the snapshots and list when they were captured as well as on which line they were captured.
        var i = 0;
        for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
            var snapshot = snapshots_1[_i];
            var relativeTime = snapshot.time - startTime;
            console.log("".concat(c.yellow("Snapshot (".concat(i, ")")), ":"));
            console.log("".concat(TAB).concat(c.yellow("Time Recorded"), ": ").concat(relativeTime, "ms after start."));
            console.log("".concat(TAB).concat(c.yellow("Line"), ": ").concat(snapshot.event.line));
            console.log("".concat(TAB).concat(c.yellow("Assignment Type"), ": ").concat(snapshot.event.type));
            console.log("".concat(TAB).concat(c.yellow("Name"), ": \"").concat(snapshot.event.name, "\""));
            console.log();
            i++;
        }
        var snapshotNumber = input.readInteger("> Enter the number of a snapshot to inspect.\n");
        if (snapshotNumber >= 0 && snapshotNumber < snapshots.length) {
            var snapshot = snapshots[snapshotNumber];
            var relativeTime = snapshot.time - startTime;
            console.clear();
            // Dump the entire scope
            console.log("".concat(c.yellow("Scope"), ":"));
            for (var key in snapshot.scope) {
                var value = snapshot.scope[key];
                console.log("".concat(TAB).concat(c.yellow(key), ": ").concat(JSON.stringify(value)));
            }
            console.log();
            // Print information about the assignment that has taken place there.
            console.log("".concat(c.yellow("Snapshot (".concat(snapshotNumber, ")")), ":"));
            console.log("".concat(TAB).concat(c.yellow("Time Recorded"), ": ").concat(relativeTime, "ms after start."));
            console.log("".concat(TAB).concat(c.yellow("Line"), ": ").concat(snapshot.event.line));
            console.log("".concat(TAB).concat(c.yellow("Assignment Type"), ": ").concat(snapshot.event.type));
            console.log("".concat(TAB).concat(c.yellow("Name"), ": \"").concat(snapshot.event.name, "\""));
            console.log("".concat(TAB).concat(c.yellow("Value"), ": ").concat(JSON.stringify(snapshot.event.value)));
            // Print the contextual lines of the file.
            var line = snapshot.event.line;
            var output = "";
            var lines = fs.readFileSync(r.inputFile).toString().split("\n");
            var followingLines = lines.slice(line - 5, line + 4);
            for (var _a = 0, _b = Object.entries(followingLines); _a < _b.length; _a++) {
                var _c = _b[_a], lineNumber = _c[0], line_1 = _c[1];
                var correctedLine = parseInt(lineNumber, 10) + snapshot.event.line - 5;
                if (correctedLine === snapshot.event.line - 1) {
                    output += "".concat(TAB_SM).concat(c.red(">> ".concat(correctedLine + 1, "|"))).concat(TAB_SM).concat(line_1, "\n");
                }
                else {
                    output += "".concat(TAB).concat(correctedLine + 1, "|").concat(TAB_SM).concat(line_1, "\n");
                }
            }
            console.log(output);
            var char = input.readChar("> Press ".concat(c.bold("s"), " to get a list of all captured snapshots.\n"));
            if (char === "s") {
                console.clear();
                console.log(this.formatSnapshots(r));
            }
        }
    };
    ResultPrinter.prototype.formatAssertions = function (r, channel) {
        var output = "";
        var TAB = " ".repeat(6);
        var TAB_SM = " ".repeat(3);
        // Loop through all the assertions and check if they're in a group.
        // If they are, print the group name and the assertion.
        // If they aren't, print the assertion.
        var file = r.inputFile;
        var groups = r.result.groups;
        var assertions = Object.values(r.result.assertions);
        for (var _i = 0, assertions_1 = assertions; _i < assertions_1.length; _i++) {
            var assertion = assertions_1[_i];
            // If the assertion passed we want to write a "PASS" sign with green background
            // If the assertion failed we want to write a "FAIL" sign with red background
            var color = assertion.result ? c.bgGreen : c.bgRed;
            var sign = assertion.result ? "PASS" : "FAIL";
            output += color(sign) + " " + "".concat(file, ":").concat(assertion.line) + "\n";
            output += "     " + assertion.description + "\n";
            // If the assertion failed, we want to print the line where it failed and the following 5 lines;
            if (!assertion.result) {
                output += "\n";
                var lines = fs.readFileSync(file).toString().split("\n");
                var followingLines = lines.slice(assertion.line - 5, assertion.line + 4);
                for (var _a = 0, _b = Object.entries(followingLines); _a < _b.length; _a++) {
                    var _c = _b[_a], lineNumber = _c[0], line = _c[1];
                    var correctedLine = parseInt(lineNumber, 10) + assertion.line - 5;
                    if (correctedLine === assertion.line - 1) {
                        output += "".concat(TAB_SM).concat(c.red(">> ".concat(correctedLine + 1, "|"))).concat(TAB_SM).concat(line, "\n");
                    }
                    else {
                        output += "".concat(TAB).concat(correctedLine + 1, "|").concat(TAB_SM).concat(line, "\n");
                    }
                }
                output += "\n";
            }
        }
        return output;
    };
    return ResultPrinter;
}());
export { ResultPrinter };
//# sourceMappingURL=ResultPrinter.js.map