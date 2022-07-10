/// <reference types="node" />
import * as http from "http";
export default class Server {
    private instance;
    constructor(port?: number);
    requestListener(req: http.IncomingMessage, res: http.ServerResponse): void;
}
