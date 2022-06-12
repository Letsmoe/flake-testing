import { ResultPipe } from "../class.ResultPipe";
declare class ResultPrinter {
    private pipe;
    private result;
    constructor(pipe: ResultPipe);
    private formatResultInfo;
    private formatHeader;
    print(identifier: string): void;
    private printMain;
    private formatSnapshots;
    showOptionsList(current: string): void;
    formatAssertions(): any;
}
export { ResultPrinter };
