import * as mime from "mime-types";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { __dirname } from "./dirname.js";
var Server = /** @class */ (function () {
    function Server(port) {
        if (port === void 0) { port = 8086; }
        this.instance = http.createServer(this.requestListener.bind(this));
        this.instance.listen(port);
    }
    Server.prototype.requestListener = function (req, res) {
        var p = path.join(__dirname, "../assets/", req.url == "/" ? "index.html" : req.url);
        if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
            var type = mime.lookup(p);
            res.setHeader("Content-Type", type);
            res.writeHead(200);
            var content = fs.readFileSync(p);
            res.end(content);
        }
        else {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end("<h1>Missing files, consider reinstalling.</h1>");
        }
    };
    return Server;
}());
export default Server;
//# sourceMappingURL=Server.js.map