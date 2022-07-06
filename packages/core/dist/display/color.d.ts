interface ColorObject {
    yellow: (message: string) => string;
    red: (message: string) => string;
    green: (message: string) => string;
    blue: (message: string) => string;
    lightblue: (message: string) => string;
    black: (message: string) => string;
    lightgreen: (message: string) => string;
    underline: (message: string) => string;
    bold: (message: string) => string;
    bg: ColorObject;
    rgb: ([r, g, b]: number[]) => (message: string, settings: {
        skipReset: boolean;
    }) => string;
    default: ([r, g, b]: number[]) => (message: string, settings: {
        skipReset: boolean;
    }) => string;
}
declare const c: ColorObject;
export { c };
