import { sideEffects, currIt, currDesc } from "./side-effects.js";
import { Task } from "./task.js";
import { showTestsResults } from "./result-display.js";
var stats = { describes: [], failed: 0, passed: 0, total: 0 };
function expect(result, register = true) {
    var isAsync = false;
    var declineResult = false;
    /**
     * Write every function into the resultFunctions array and compare at the end when everything has been initialized.
     * Otherwise the "and", "or" and "result" arguments won't work properly.
     */
    const resultFunctions = [];
    const lookupObject = new Proxy({
        toBe: (r, x) => ({
            message: `expected '${r}'to be '${x}'`,
            pass: Object.is(x, r),
        }),
        toEqual: (r, x) => ({
            message: `expected '${r}' to equal '${x}'`,
            pass: x == r,
        }),
        closeTo: (r, x, digits = 2) => ({
            message: `expected '${r}' to be ${digits} digits close to '${x}'`,
            pass: Math.abs(r - x) < Math.pow(10, -digits) / 2,
        }),
        toBeTruthy: (r) => ({
            message: `expected '${r}' to be truthy`,
            pass: r ? true : false,
        }),
        toBeFalsy: (r) => ({
            message: `expected '${r}' to be falsy`,
            pass: r ? false : true,
        }),
        toBeInTheDocument: (r) => ({
            message: `expected node to be in the document`,
            pass: document.contains(r),
        }),
        to: (r, fn) => {
            // Test if a custom function returns true.
            return { message: `expected function to return '${r}'`, pass: fn(r) };
        },
        toBeIn: (r, parent) => ({
            message: `expected node to be in ${parent}`,
            pass: parent.contains(r),
        }),
        toBeChildOf: (r, parent) => ({
            message: `expected node to be child of ${parent}`,
            pass: r.parentNode == parent,
        })
    }, {
        set: () => false,
        get: (x, y) => {
            if (y === "not") {
                declineResult = !declineResult;
                return lookupObject;
            }
            else if (y === "resolves") {
                isAsync = true;
                return lookupObject;
            }
            else if (y === "and") {
                return lookupObject;
            }
            else if (y === "result") {
                return resultFunctions[resultFunctions.length - 1].result.pass;
            }
            return (...args) => {
                let task = new Task(x[y], {
                    expected: result,
                    args: args
                }, isAsync, declineResult, register);
                task.onDidFinish(() => {
                    showTestsResults();
                });
                task.run();
                resultFunctions.push(task);
                showTestsResults();
                return lookupObject;
            };
        },
    });
    return lookupObject;
}
const runSideEffects = (arr) => arr.map((x) => x.apply(this));
function it(desc, fn) {
    const oldLengths = getSideEffectsLengths();
    runSideEffects(sideEffects.beforeEach);
    currIt.current = {
        name: desc,
        expects: [],
    };
    currDesc.current.it.push(currIt.current);
    fn.apply(this);
    runSideEffects(sideEffects.afterEach);
    clearSideEffects(oldLengths);
}
function clearSideEffects(oldLengths) {
    for (const key in oldLengths) {
        // Remove last elements from array to fit the old length.
        sideEffects[key].splice(oldLengths[key], sideEffects[key].length - oldLengths[key]);
    }
}
function getSideEffectsLengths() {
    let obj = [];
    for (const key in sideEffects) {
        obj[key] = sideEffects[key].length;
    }
    return obj;
}
function describe(desc, fn) {
    // Get length of each sideEffect array, every added one after execution is one too much.
    const oldLengths = getSideEffectsLengths();
    currDesc.current = {
        name: desc,
        it: [],
    };
    stats.describes.push(currDesc.current);
    runSideEffects(sideEffects.beforeAll);
    fn.apply(this);
    runSideEffects(sideEffects.afterAll);
    clearSideEffects(oldLengths);
}
export { describe, it, expect, stats, };
