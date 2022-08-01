import { callbacks } from "./shared.js";

export function beforeEach(callback: () => void): void {
	callback()
	callbacks.beforeEach.push(callback)
}

export function afterEach(callback: () => void): void {
	callbacks.afterEach.push(callback)
}