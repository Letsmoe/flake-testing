/**
 * Whenever we want to execute a test, we would normally take the test file and run it in some kind of enclosed space so we can make sure our results are not
 * being corrupted by some unwanted side effects.
 * Since we want to be able to execute test files written in multiple languages and there might not be a wrapper around this language for JavaScript,
 * we want to share our test results across files, meaning every test result will be written to disk where it can be picked up from here.
 * 
 * Since we know that a common folder has already been created we can just use this as a bridge between the test runner and the result provider.
 * We'll just need to read from the file system on regular intervals.
 * 
 * Another option is to listen for any events via an HTTP endpoint that can be queried and which will accept our test results.
 * 
 * NOTE:
 * Since we know that every testing environment will process a test like this:
 * ```js
 * describe("{DESCRIPTION}", () => {
 * 	it("{ITEM}", () => {
 * 		expect(XYZ).toBe(ABC);
 * 	})
 * })```
 * 
 * We can rely on a common denominator to extract the description and item from the test file which can then be displayed later on.
 * In the process we might as well collect data about the test runner and of course specify information about the test file.
 */


class ResultProvider {
	constructor() {

	}
}

export { ResultProvider }