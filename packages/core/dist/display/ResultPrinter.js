import supportsColor from "supports-color";
import * as input from "wait-console-input";
import * as fs from "fs";
var Reset = "\x1b[0m";
var colorsTrueColor = {
    yellow: [255, 209, 102],
    green: [130, 158, 46],
    red: [224, 0, 90],
    blue: [33, 145, 251],
    lightblue: [155, 206, 253],
    black: [35, 32, 32],
    lightgreen: [218, 232, 176],
    underline: [4],
    bold: [1],
};
var colors256 = {
    yellow: "33",
    green: "32",
    red: "31",
    blue: "34",
    lightblue: "36",
    black: "30",
    lightgreen: "92",
    underline: "4",
    bold: "1",
    bg: {
        yellow: "43",
        green: "42",
        red: "41",
        blue: "44",
        lightblue: "46",
        black: "40",
        lightgreen: "102",
    }
};
var color = function (color) { return function (message, settings) {
    if (settings === void 0) { settings = { skipReset: false }; }
    return "\u001B[".concat(color, "m").concat(message).concat(settings.skipReset ? "" : Reset);
}; };
var handler = {};
handler.get = function (target, prop) {
    // Check if the console supports truecolor
    if (supportsColor.stdout) {
        // Check if the property is a color
        if (prop === "bg") {
            return new Proxy({
                rgb: function (_a) {
                    var r = _a[0], g = _a[1], b = _a[2];
                    return function (message, settings) {
                        if (settings === void 0) { settings = { skipReset: false }; }
                        return "\u001B[48;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(message).concat(settings.skipReset ? "" : Reset);
                    };
                }
            }, handler);
        }
        if (colorsTrueColor[prop]) {
            if (colorsTrueColor[prop].length === 3) {
                return target.rgb(colorsTrueColor[prop]);
            }
            else {
                return color(colorsTrueColor[prop][0]);
            }
        }
    }
    else {
        // Check if the property is a color
        if (colors256[prop]) {
            return colors256[prop];
        }
    }
};
var c = new Proxy({
    rgb: function (_a) {
        var r = _a[0], g = _a[1], b = _a[2];
        return function (message, settings) {
            if (settings === void 0) { settings = { skipReset: false }; }
            return "\u001B[38;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(message).concat(settings.skipReset ? "" : Reset);
        };
    }
}, handler);
var ResultPrinter = /** @class */ (function () {
    function ResultPrinter(pipe) {
        this.pipe = pipe;
        pipe.attach(function (eventName, filePath) {
            console.log("".concat(eventName, ": ").concat(filePath));
        });
    }
    ResultPrinter.prototype.formatResultInfo = function () {
        var numAssertions = this.result.result.assertions.length;
        var _a = [this.result.result.groups, Object.keys(this.result.result.groups).length], groups = _a[0], numGroups = _a[1];
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
        var arrAssertions = this.result.result.assertions;
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
            [c.yellow("Snapshots"), this.result.snapshots.length],
            [c.yellow("Time"), "".concat(this.result.endTime - this.result.startTime, "ms")],
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
        }).join("\n") + "\n";
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
        return "Running flake version 0.0.1;";
    };
    ResultPrinter.prototype.print = function (identifier) {
        var channel = this.pipe.getChannel(identifier);
        if (channel) {
            var result = channel.asJSON();
            this.result = result;
            this.printMain();
        }
    };
    ResultPrinter.prototype.printMain = function () {
        console.clear();
        console.log(this.formatHeader());
        console.log(this.formatAssertions());
        console.log(this.formatResultInfo());
        console.log();
        this.showOptionsList("main");
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
            var snapshot_1 = snapshots_1[_i];
            var relativeTime_1 = snapshot_1.time - startTime;
            console.log("".concat(c.yellow("Snapshot (".concat(i, ")")), ":"));
            console.log("".concat(TAB).concat(c.yellow("Line"), ": ").concat(snapshot_1.event.line));
            console.log("".concat(TAB).concat(c.yellow("Name"), ": \"").concat(snapshot_1.event.name, "\""));
            console.log();
            i++;
        }
        var snapshotNumber;
        do {
            snapshotNumber = input.readInteger("> Enter the number of a snapshot to inspect.\n");
        } while (snapshotNumber > snapshots.length - 1 || snapshotNumber < 0);
        var snapshot = snapshots[snapshotNumber];
        var relativeTime = snapshot.time - startTime;
        console.clear();
        // Dump the entire scope
        console.log("".concat(c.bg.green("Scope"), ":"));
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
        this.showOptionsList("");
    };
    ResultPrinter.prototype.showOptionsList = function (current) {
        if (current !== "snapshots")
            console.log("> Press ".concat(c.bold("s"), " to get a list of all captured snapshots."));
        if (current !== "main")
            console.log("> Press ".concat(c.bold("r"), " to return to the main window."));
        console.log("> Press ".concat(c.bold("e"), " to exit the debugger."));
        var char = input.readChar();
        if (char === "s") {
            console.clear();
            console.log(this.formatSnapshots(this.result));
        }
        else if (char === "r") {
            this.printMain();
        }
        else if (char === "e") {
            process.exit(0);
        }
    };
    ResultPrinter.prototype.formatAssertions = function () {
        var output = "";
        var TAB = " ".repeat(6);
        var TAB_SM = " ".repeat(3);
        // Loop through all the assertions and check if they're in a group.
        // If they are, print the group name and the assertion.
        // If they aren't, print the assertion.
        var file = this.result.inputFile;
        var groups = this.result.result.groups;
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
        var assertions = Object.values(this.result.result.assertions);
        for (var _d = 0, assertions_1 = assertions; _d < assertions_1.length; _d++) {
            var assertion = assertions_1[_d];
            var name_2 = assertion.name;
            // If the assertion passed we want to write a "PASS" sign with green background
            // If the assertion failed we want to write a "FAIL" sign with red background
            var color_1 = assertion.result ? c.bg.green : c.bg.red;
            var sign = assertion.result ? "PASS" : "FAIL";
            // Remove the path of the config from the filepath since we don't want to list literally the whole thing.
            var replacedFile = file.replace(process.cwd(), "");
            output += groupMap[name_2] ? "".concat(c.blue(groupMap[name_2]), ": ") : "";
            output += color_1(sign) + " " + "".concat(replacedFile, ":").concat(assertion.line) + "\n";
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
export { ResultPrinter };
//# sourceMappingURL=ResultPrinter.js.map