import * as ws from "ws";
var WSServer = /** @class */ (function () {
    function WSServer(port) {
        if (port === void 0) { port = 8088; }
        this.connections = new Map();
        this.lastPacket = [];
        this.listeners = {};
        this.connectionCount = 0;
        this.instance = new ws.WebSocketServer({ port: port });
        this.instance.on("connection", this.connectionReceiver.bind(this));
    }
    WSServer.prototype.onStateChange = function () { };
    WSServer.prototype.onReceiveMessage = function (raw) {
        var data = JSON.parse(raw.toString());
        var msgType = data.type;
        var msgAction = data.action;
        var msgData = data.data;
        if (this.listeners[msgAction]) {
            this.listeners[msgAction].forEach(function (action) {
                action(msgData, msgType);
            });
        }
    };
    WSServer.prototype.onMessage = function (action, callback) {
        if (!this.listeners.hasOwnProperty(action)) {
            this.listeners[action] = [];
        }
        this.listeners[action].push(callback);
    };
    WSServer.prototype.connectionReceiver = function (ws) {
        var _this = this;
        this.connectionCount++;
        console.log("Client connected to server.");
        var id = Symbol("id");
        ws.on("close", function () {
            _this.connections.delete(id);
            _this.connectionCount--;
            _this.onStateChange();
        });
        ws.onerror = function () {
            console.log("Error occurred in Websocket connection.");
        };
        ws.on("message", function (data) {
            _this.onReceiveMessage(data);
        });
        this.connections.set(id, ws);
        this.onStateChange();
        this.submit(this.lastPacket);
    };
    WSServer.prototype.submit = function (obj) {
        this.lastPacket = obj;
        var data = JSON.stringify({
            type: "POST",
            action: "DISPLAY_RESULT",
            data: obj
        });
        this.connections.forEach(function (connection) {
            connection.send(data);
        });
    };
    return WSServer;
}());
export default WSServer;
//# sourceMappingURL=WebSocketServer.js.map