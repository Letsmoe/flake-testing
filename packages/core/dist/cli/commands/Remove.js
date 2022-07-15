import { getResults } from "../../utils/results.js";
import * as fs from "fs";
export default function RemoveCommand(args) {
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
}
//# sourceMappingURL=Remove.js.map