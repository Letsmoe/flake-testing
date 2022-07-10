import * as fs from "fs";
export function getResults() {
    var p = process.cwd() + "/.flake/results/";
    if (fs.existsSync(p)) {
        return fs.readdirSync(p);
    }
    else {
        throw new Error("The results directory does not exist. Can't pull results.");
    }
}
//# sourceMappingURL=results.js.map