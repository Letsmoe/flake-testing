import { hasSubstring } from "../lib/test.js";
/**
 * @every This should complete since the result is always true.
 * @group succeed
 */

/**
 * This is the next description where they @every won't apply
 */

afterAll: () => {
	console.log("Succeeded")
}

$: hasSubstring("awd", "a") === false;

/**
 * We don't need anything else...
 */