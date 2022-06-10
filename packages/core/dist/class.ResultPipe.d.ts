import * as fs from "fs";
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
declare type ResultListener = (eventName: string, filePath: string) => void;
declare class ResultPipe {
    private config;
    private dir;
    private listeners;
    private channels;
    constructor();
    ready(): void;
    attach(callback: ResultListener): void;
    detach(callback: ResultListener): void;
    /**
     * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
     * @date 6/8/2022 - 11:34:52 PM
     *
     * @private
     */
    private createTempFolder;
    /**
     * A function to open a new channel for writing to a file with a unique job identifier.
     * @returns A unique identifier that may only be used for writing a file once, will be deactivated afterwards.
     */
    open(): string;
    getChannel(channel: string): {
        getPath: () => string;
        getContent: () => string;
        stream: () => fs.ReadStream;
        asJSON: () => any;
        dump: () => void;
        delete: () => void;
    };
    /**
     * A function to write the results of a test to a file, then notifying all listeners of the event and closing the channel afterwards.
     * @param identifier A unique identifier corresponding to an open channel.
     * @param content The content to write to the file.
     */
    write(identifier: string, content: string | object): void;
    getCacheFolder(): string;
}
export { ResultPipe };
