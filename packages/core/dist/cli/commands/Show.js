import { ResultPrinter } from "../../display/ResultPrinter.js";
import { getResults } from "../../utils/results.js";
import * as fs from "fs";
export default function ShowCommand(args) {
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
}
//# sourceMappingURL=Show.js.map