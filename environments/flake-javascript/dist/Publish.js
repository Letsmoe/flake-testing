import { output } from "./shared.js";
import { getTime } from "./time.js";
/**
 * Will print all results directly to the console once all tests are done, this will happen either once an event is triggered on the window or the node process exits.
 * @date 7/13/2022 - 10:53:30 PM
 *
 * @export
 */
export function PublishOnFinished() {
    if (typeof window !== 'undefined') {
        // TODO: Implement check if finished.
    }
    else {
        process.on("exit", () => {
            output.endTime = getTime();
            console.log(JSON.stringify(output, null, 4));
        });
    }
}
