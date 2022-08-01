import { output, scope } from "./shared.js";
import { getTime } from "./time.js";
import { getLine } from "./Utils.js";
export function capture(value) {
    let line = getLine();
    output["snapshots"].push({
        time: getTime(),
        event: {
            type: "reassign",
            line: line - 1,
            name: "capture",
            value: value,
            from: 0,
            to: 0
        },
        context: {},
        scope: Object.assign({}, scope)
    });
}
