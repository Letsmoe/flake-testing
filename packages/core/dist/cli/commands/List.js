import { basename } from "path";
import { c } from "../../display/color.js";
import { getResults } from "../../utils/results.js";
import * as fs from "fs";
export default function ListCommand() {
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
}
//# sourceMappingURL=List.js.map