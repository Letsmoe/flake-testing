interface Command {
    exec?: string;
    module?: {
        name: string;
        import: string;
    };
    options?: {
        [key: string]: any;
    };
}
interface Rule {
    test: string;
    use?: {
        loader?: string;
        options?: {
            [key: string]: any;
        };
    }[];
    commands?: Command[];
}
interface FlakeConfigObject {
    /**
     * A list of regular expressions that will be ignored when searching for files.
     */
    exclude?: string[];
    /**
     * Watch for changes to the source files and restart the tests once a change is detected.
     */
    watch?: boolean;
    watchOptions?: {
        /**
         * The time in milliseconds to wait between checking the watched folder for file changes.
         */
        poll?: number;
        /**
         * The time in milliseconds to wait for more changes before emitting a change event.
         */
        aggregateTimeout?: number;
        /**
         * A list of regular expressions for files to ignore when watching for changes.
         */
        ignored?: string[];
        [k: string]: unknown;
    };
    /**
     * The directory to search for test files.
     */
    dir?: string;
    /**
     * Whether to compare to truthiness or strict "true"
     */
    strictCompare: boolean;
    /**
     * How many lines should be visible around an error to contextualize the error message.
     */
    contextualLines?: number;
    /**
     * A list of rules to follow while searching for files.
     * @default require("../Loaders.js").DEFAULT_LOADERS
     */
    rules?: Rule[];
    [k: string]: unknown;
}
export { FlakeConfigObject };
