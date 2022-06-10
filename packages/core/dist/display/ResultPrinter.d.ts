import { ResultPipe } from "../class.ResultPipe";
import { OutputObject } from "../types";
declare class ResultPrinter {
    private pipe;
    constructor(pipe: ResultPipe);
    private formatResultInfo;
    private formatHeader;
    print(identifier: string): void;
    private formatSnapshots;
    formatAssertions(r: OutputObject, channel: any): any;
}
export { ResultPrinter };
