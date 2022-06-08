import { SocketServer } from "./server/websocket.js";
const shared: { stats: any[]; root: string; paths: string[] } = {
	stats: [],
	root: undefined,
	paths: [],
};

export { shared };
