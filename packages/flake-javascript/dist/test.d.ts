declare var stats: {
    describes: any[];
    failed: number;
    passed: number;
    total: number;
};
declare global {
    interface Window {
        SnowblindTesting: (...args: any[]) => void;
    }
}
declare function expect(result: any, register?: boolean): any;
declare function it(desc: string, fn: Function): void;
declare function describe(desc: string, fn: Function): void;
declare function hasSubstring(): boolean;
export { describe, hasSubstring, it, expect, stats, };
//# sourceMappingURL=test.d.ts.map