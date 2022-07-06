import { FlakeConfigObject } from "./config/config.type";
import { ResultPrinter } from "./display/ResultPrinter.js";
import { allowExecution } from "./args.js";
import { OutputObject } from "./types/OutputObject";
interface ConnectionOptions {
    displayOnSubmit?: boolean;
    defaultFileExtension?: string;
    enableServer?: boolean;
}
declare class Connection {
    private config;
    private server?;
    private wsServer?;
    options: ConnectionOptions;
    private contentMap;
    private resultMap;
    private dir;
    private directory;
    printer: ResultPrinter;
    constructor(config: FlakeConfigObject, options: ConnectionOptions);
    submit(obj: OutputObject[]): void;
    subscribe(matcher: RegExp, callback: Flake.ConnectionCallback): void;
    /**
     * A function to prepare for the execution and submission of a result.
     * @date 7/3/2022 - 12:53:04 PM
     *
     * @public
     * @param {string} hash
     * @param {((err: Error | null, submitResult: (result: any) => void) => void)} callback
     */
    prepare(hash: string, callback: (err: Error | null, submitResult?: (result: any) => void) => void): void;
    private writeFile;
}
declare namespace Flake {
    function getConfig(basePath?: string): Promise<FlakeConfigObject>;
    function connect(config: FlakeConfigObject, options: ConnectionOptions): Connection;
    function display(connection: Connection): void;
    type SubmitFunction = (content: string) => string;
    type ConnectionCallback = (submit: Flake.SubmitFunction, hash: string, content: string) => void;
}
export { Flake, allowExecution };
