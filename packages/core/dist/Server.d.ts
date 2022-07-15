/// <reference types="node" />
import * as http from "http";
export default class Server {
    private socketServerPort;
    private instance;
    constructor(port?: number, socketServerPort?: number);
    close(): void;
    requestListener(req: http.IncomingMessage, res: http.ServerResponse): void;
}
