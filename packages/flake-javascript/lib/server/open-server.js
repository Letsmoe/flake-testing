import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
class WebServer {
    constructor(port = 7072, baseFolder = process.cwd()) {
        this.port = port;
        this.baseFolder = baseFolder;
        this.server = http.createServer(this.provider.bind(this));
        this.server.listen(port, '127.0.0.1');
        console.log("Opened a local server on port " + port);
    }
    getFile(fileName) {
        if (fs.existsSync(fileName) && fs.lstatSync(fileName).isFile()) {
            let content = fs.readFileSync(fileName, "utf8");
            let type = mime.lookup(fileName);
            return [type, content];
        }
        else {
            console.warn("File does not exist: " + fileName);
            return ["text/plain", ""];
        }
    }
    set folder(newFolder) {
        this.baseFolder = newFolder;
    }
    provider(req, res) {
        let requestURL = req.url;
        let type, file;
        if (requestURL.startsWith("/index") || requestURL === "/") {
            [type, file] = this.getFile(path.join(this.baseFolder, "test/index.test.html"));
            file += `<script type="text/javascript"></script>`;
        }
        else {
            [type, file] = this.getFile(path.join(this.baseFolder, requestURL));
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(file);
    }
}
export { WebServer };
