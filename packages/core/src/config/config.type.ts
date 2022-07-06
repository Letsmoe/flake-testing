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
	own?: {
		dirPath?: string;
		fileName?: string;
	};
	/**
	 * Whether to compare to truthiness or strict "true"
	 */
	strictCompare: boolean;
	[k: string]: unknown;
}


export { FlakeConfigObject }