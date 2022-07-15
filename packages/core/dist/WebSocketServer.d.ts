import { OutputObject } from "./types/";
export default class WSServer {
    private instance;
    private connections;
    private lastPacket;
    private listeners;
    root: string;
    connectionCount: number;
    constructor(port?: number);
    close(): void;
    onStateChange(): void;
    private onReceiveMessage;
    onMessage(action: string, callback: Function): void;
    private connectionReceiver;
    submit(obj: OutputObject[]): void;
}
