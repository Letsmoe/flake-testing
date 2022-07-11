import { WebSocket } from "ws";
import { FlakeConfigObject } from "@flake-universal/core/dist/config/config.type";
export default class HTTPServer {
    private config;
    port: number;
    private root;
    private node_dir;
    private server;
    private wss;
    connections: {
        [key: symbol]: WebSocket;
    };
    private callbacks;
    constructor(config: FlakeConfigObject, port?: number, root?: string, node_dir?: string);
    private listener;
    on(event: string, callback: () => void): void;
    private processes;
    send(data: string | object): Promise<unknown>;
    private tryResolvePackage;
    serve(file: string): Promise<unknown>;
}
//# sourceMappingURL=HttpServer.d.ts.map