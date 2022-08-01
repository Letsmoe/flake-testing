import { callbacks } from "./shared.js";
export function beforeEach(callback) {
    callback();
    callbacks.beforeEach.push(callback);
}
export function afterEach(callback) {
    callbacks.afterEach.push(callback);
}
