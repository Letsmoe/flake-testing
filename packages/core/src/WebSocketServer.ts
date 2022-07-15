import * as ws from "ws";
import { OutputObject } from "./types/";

export default class WSServer {
	private instance: ws.WebSocketServer;
	private connections: Map<Symbol, ws.WebSocket> = new Map<Symbol, ws.WebSocket>();
	private lastPacket: OutputObject[] = [];
	private listeners: {[key: string]: Function[]} = {};
	public root: string = "";
	public connectionCount: number = 0;

	constructor(port: number = 8088) {
		this.instance = new ws.WebSocketServer({ port });
		this.instance.on("connection", this.connectionReceiver.bind(this));
	}

	public close() {
		this.instance.close()
	}

	public onStateChange() {}
	private onReceiveMessage(raw: ws.RawData) {
		let data = JSON.parse(raw.toString());
		let msgType = data.type;
		let msgAction = data.action;
		let msgData = data.data;

		if (this.listeners[msgAction]) {
			this.listeners[msgAction].forEach(action => {
				action(msgData, msgType)
			})
		}
	}

	public onMessage(action: string, callback: Function) {
		if (!this.listeners.hasOwnProperty(action)) {
			this.listeners[action] = [];
		}
		this.listeners[action].push(callback)
	}

	private connectionReceiver(ws: ws.WebSocket) {
		this.connectionCount++
		console.log("Client connected to server.");
		let id = Symbol("id");

		ws.on("close", () => {
			this.connections.delete(id);
			this.connectionCount--
			this.onStateChange()
		})

		ws.onerror = () => {
			console.log("Error occurred in Websocket connection.")
		}

		ws.on("message", (data) => {
			this.onReceiveMessage(data)
		})

		this.connections.set(id, ws);
		this.onStateChange()
		this.submit(this.lastPacket);
	}

	public submit(obj: OutputObject[]) {
		this.lastPacket = obj;
		let data = JSON.stringify({
			type: "POST",
			action: "DISPLAY_RESULT",
			data: {
				results: obj,
				root: this.root
			}
		});
		this.connections.forEach(connection => {
			connection.send(data);
		})
	}
}