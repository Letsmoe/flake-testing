import { SpecifierObject } from "@flake-universal/core";
import { FlakeConfigObject } from "@flake-universal/core/dist/config/config.type";
declare function InitTestEnvironment(callback: Function, config: FlakeConfigObject): ((({ line, from, to, content, description, name, result, }: {
    line: any;
    from: any;
    to: any;
    content: any;
    description: any;
    name: any;
    result: any;
}) => void) | ((groups: {
    [key: string]: number[];
}) => void) | ((x: number) => void) | ((specifiers: SpecifierObject[], source: string, from: number, to: number, line: number) => void) | ((name: string, callback: Function, line: number, start: number, end: number) => void) | ((name: string, value: any, { line, from, to, type }: {
    line: any;
    from: any;
    to: any;
    type: any;
}) => any))[];
export { InitTestEnvironment };
//# sourceMappingURL=defaultScript.d.ts.map