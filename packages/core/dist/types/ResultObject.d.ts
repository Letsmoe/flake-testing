import { AssertionObject } from "./AssertionObject";
export declare type ResultObject = {
    groups: {
        [key: string]: number[];
    };
    assertions: AssertionObject[];
};
