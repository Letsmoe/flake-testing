import { OutputObject } from "../types";
declare class ResultPrinter {
    private headers;
    private result;
    private margin;
    private currentIndex;
    constructor();
    private formatResultInfo;
    private formatHeader;
    addHeader(message: string): void;
    reserveHeader(message: string): (msg: string) => void;
    print(result: OutputObject[]): void;
    private readListeners;
    private closeAllListeners;
    private printMain;
    private formatSnapshots;
    showOptionsList(current: string): void;
    formatAssertions(obj: OutputObject): any;
}
export { ResultPrinter };
