import { SpecifierObject } from "./SpecifierObject";
export declare type ImportObject = {
    line: number;
    from: number;
    to: number;
    source: string;
    specifiers: SpecifierObject[];
};
