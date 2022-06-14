import { FlakeConfigObject } from "./config/config.type";
declare class FileExecutor {
    private rewriter;
    private executor;
    constructor(rewriter: Function, executor: Function);
    execute(file: string, options: any): Promise<any>;
    collectFiles(matcher: RegExp, config: FlakeConfigObject): string[];
}
export { FileExecutor };
