import { colarg } from "colarg";
import * as fs from "fs";
import { basename } from "path";
import { c } from "./display/color.js";
import { ResultPrinter } from "./display/ResultPrinter.js";
import { getResults } from "./utils/results.js";
var allowExecution = true;
var args = colarg(process.argv.slice(2))
    .option({
    name: "config",
    alias: "p",
    type: "string",
    description: "The path to the config file",
    defaults: "./flake.config.json"
}).command("snapshots", "Display a list of snapshots from the most recent test or a specific run.", function () {
    process.exit();
}).command("ls", "Display a list of all tests stored in the .flake folder", function () {
    // Read the .flake directory
    var runs = getResults();
    // Loop through all files, the filenames are the dates where the tests have been captured.
    runs.forEach(function (run, i) {
        var time = new Date(parseInt(run));
        // Read the file and check if it succeeded
        var file = JSON.parse(fs.readFileSync(process.cwd() + "/.flake/results/" + run).toString());
        var testFile = basename(file.inputFile);
        var success = file.status === true;
        var _a = file.result.assertions.reduce(function (acc, curr) {
            if (curr.result === true) {
                return [acc[0], acc[1] + 1];
            }
            else {
                return [acc[0] + 1, acc[1]];
            }
        }, [0, 0]), failed = _a[0], succeeded = _a[1];
        var ratio = (succeeded / file.result.assertions.length * 100);
        ratio = ratio > 50 ? c.bg.green("".concat(ratio.toFixed(1), "%")) : c.bg.red("".concat(ratio.toFixed(1), "%"));
        var pad = function (x) { return x.toString().padStart(2, '0'); };
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        console.log("".concat(i, " | ").concat(c.yellow(testFile), " - ").concat(months[time.getMonth()], " ").concat(pad(time.getDate()), " ").concat(time.getFullYear(), " ").concat(pad(time.getHours()), ":").concat(pad(time.getMinutes()), ":").concat(pad(time.getSeconds()), " [").concat(success ? c.green("SUCCESS") : c.red("FAIL"), "] | ").concat(ratio));
    });
    if (runs.length == 0) {
        console.log("We could not find any test runs here 😟");
    }
    process.exit(0);
}).command("show", "Display a specific test run, picked by an index (use 'flake ls' for that) or the newest one.", function (capture) {
    var args = capture.option({
        name: "index",
        alias: "x",
        description: "The index to display results from.",
        required: false,
        type: "number"
    }).help().args;
    var files = getResults();
    var index;
    if (args.index !== undefined && args.index > -1) {
        index = args.index;
    }
    else {
        index = files.length - 1;
    }
    // Read the file at the specified index.
    var file = fs.readFileSync(process.cwd() + "/.flake/results/" + files[index]).toString();
    var json = JSON.parse(file);
    // Pass the json results to the ResultPrinter, which will take care of printing it properly.
    var printer = new ResultPrinter();
    printer.print([json]);
    allowExecution = false;
}).command("rm", "Remove a specific test run.", function (capture) {
    var args = capture.option({
        name: "index",
        alias: "x",
        description: "The index to display results from.",
        required: false,
        type: "number"
    }).help().args;
    var files = getResults();
    var index;
    if (args.index !== undefined && args.index > -1) {
        index = args.index;
    }
    else {
        index = files.length - 1;
    }
    var p = process.cwd() + "/.flake/results/" + files[index];
    if (fs.existsSync(p)) {
        fs.rmSync(p);
        console.log("Removing finished!");
    }
    else {
        console.error("File does not exist, skipping deletion of: " + p);
    }
    process.exit(0);
}).command("rma", "Remove all previously executed test runs.", function () {
    var files = getResults();
    files.forEach(function (file, i) {
        var p = process.cwd() + "/.flake/results/" + file;
        if (fs.existsSync(p)) {
            fs.rmSync(p);
            console.log("Successfully removed test at index " + i);
        }
    });
    process.exit(0);
}).help().args;
export { args, allowExecution };
//# sourceMappingURL=args.js.map