export interface Command {
    exec?: string;
    module?: {
        name: string;
        import: string;
    };
    options?: {
        [key: string]: any;
    };
}
export interface Rule {
    test: string;
    use?: {
        loader?: string;
        options?: {
            [key: string]: any;
        };
    }[];
    commands?: Command[];
}
export declare type StatsPreset = "errors-only" | "warnings" | "verbose";
export interface Stats {
    preset?: StatsPreset;
    /**
     * Whether to include the path of the currently executing script in the output.
     * @default false
     */
    outputPath?: boolean;
    /**
     * Whether to include the name of the currently executing rule in the output, this includes:
     * 	- command name
     * 	- loader path
     * @default false
     */
    rule?: boolean;
    /**
     * Whether to include warnings in the output.
     * @default true
     */
    warnings?: boolean;
    /**
     * Whether to include error messages in the output
     * @default true
     */
    errors?: boolean;
    /**
     * Whether to include the stack trace of errors in the output.
     * @default false
     */
    errorStack?: boolean;
    /**
     * Whether to include the current version of flake in the output.
     * @default true
     */
    version?: boolean;
    /**
     * Whether to include all defined loaders in the header.
     * @default true
     */
    loaders?: boolean;
    /**
     * Whether to include the build hash in the output
     * @default false
     */
    hash?: boolean;
}
export interface DevServerOptions {
    /**
     * An object containing information about how to accept requests from another sender than the process itself.
     * This might be useful for using a backend API of another service with flake and might also be helpful when debugging an application.
     */
    api?: {
        /**
         * The port used by the API service, a separate WebSocket will be set up to allow for quicker communication between connected sockets,
         * it will always be on the next available port,
         * information about it will be transmitted in the static server response.
         * @default 8086
         */
        port?: number;
    };
    /**
     * A server will be opened to allow for looking at results with a GUI, the port specifies where it will be opened on the "localhost".
     * @default 4004
     */
    port?: number;
}
export interface FlakeConfigObject {
    /**
     * A list of regular expressions that will be ignored when searching for files.
     * @default [".*node_modules.*", ".*\.flake", "^\..*"]
     */
    exclude?: string[];
    /**
     * Watch for changes to the source files and restart the tests once a change is detected.
     * @default false
     */
    watch?: boolean;
    watchOptions?: {
        /**
         * The time in milliseconds to wait between checking the watched folder for file changes.
         * @default 500
         */
        poll?: number;
        /**
         * The time in milliseconds to wait for more changes before emitting a change event.
         * @default 100
         */
        aggregateTimeout?: number;
    };
    /**
     * The directory to search for test files.
     * @default "./"
     */
    dir?: string;
    /**
     * Whether to deeply search for test files in the current directory,
     * when this option is enabled files in subdirectories will be included as well.
     * @default true;
     */
    deepSearch?: boolean;
    /**
     * Whether to compare to truthiness or strict "true"
     * @default true;
     */
    strictCompare: boolean;
    /**
     * How many lines should be visible around an error to contextualize the error message.
     * @default 3
     */
    contextualLines?: number;
    /**
     * A list of rules to follow while searching for files.
     */
    rules?: Rule[];
    /**
     * An object with information about what to display when outputting to console, may also be a string specifying the preset to use.
     * @default "warnings"
     */
    stats?: Stats | StatsPreset;
    /**
     * An object defining properties about the development server.
     */
    devServer?: DevServerOptions;
    /**
     * A list of plugins that can be used to extend the default behavior of flake,
     * each plugin will be run in a worker process and can communicate via a pipe with the main process.
     *
     * A plugin will be passed information about the currently used config, you can read more about that [here](https://continuum-ai.de/docs/flake/config/plugins).
     * Each plugin is included via a package resolvable by node or a file path.
     * @examples [["flake-plugin", "/home/user/documents/projects/plugin/index.js"]]
     * @default []
     */
    plugins?: string[];
    /**
     * An output option that captures performance of the current process, analyzing which files most time was spent on.
     * Can be turned on or off, is most likely only useful while debugging flake or a plugin for it.
     * @default false
     */
    performanceCapturing?: boolean;
    [k: string]: unknown;
}
