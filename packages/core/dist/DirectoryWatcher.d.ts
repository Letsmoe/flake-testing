export declare function AttachDirectoryWatcher(dir: string, callback: (event: string, file: string) => void): void;
export declare function isdir(path: string): boolean;
export declare function isfile(path: string): boolean;
export declare function ScanDirectory(dir: string, main: string): [string, string][];
