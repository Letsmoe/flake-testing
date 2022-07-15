declare function variableMarkup(value: any, indent?: number, inline?: boolean): any;
declare function markupCode(code: {
    [key: string]: string;
}, markupLine: number): any;
export { markupCode, variableMarkup };
