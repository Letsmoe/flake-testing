declare class WebServer {
    port: number;
    baseFolder: string;
    private server;
    constructor(port?: number, baseFolder?: string);
    getFile(fileName: string): string[];
    set folder(newFolder: string);
    provider(req: any, res: any): void;
}
export { WebServer };
//# sourceMappingURL=open-server.d.ts.map