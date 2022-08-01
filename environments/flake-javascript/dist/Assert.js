import { output, comments, callbacks } from "./shared.js";
// The number of assertions already made, we're using this as a name.
var index = 0;
/**
 * Takes a tested value and an optional description/group name and inserts the test into the output.
 * @date 7/13/2022 - 10:38:26 PM
 *
 * @export
 * @param {boolean} value
 * @param {{ description: string; group: string; }} { description, group }
 */
export function assert(value, { description, group } = { description: "", group: "" }) {
    let result = value ? true : false;
    var e = new Error();
    if (!e.stack)
        try {
            // IE requires the Error to actually be throw or else the Error's 'stack'
            // property is undefined.
            throw e;
        }
        catch (e) {
            if (!e.stack) {
                return 0; // IE < 10, likely
            }
        }
    var stack = e.stack.toString().split(/\r\n|\n/);
    // We want our caller's frame. It's index into |stack| depends on the
    // browser and browser version, so we need to search for the second frame:
    var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
    do {
        var frame = stack.shift();
    } while (!frameRE.exec(frame) && stack.length);
    let line = parseInt(frameRE.exec(stack.shift())[1]);
    output["result"]["assertions"].push({
        line: line - 1,
        description: description || comments[group] || comments["__main"] || "",
        context: {},
        name: index.toString(),
        result: result,
        content: "assert()",
        from: 0,
        to: 0
    });
    callbacks["afterEach"].concat(callbacks["beforeEach"]).forEach(callback => {
        callback();
    });
    index++;
}
