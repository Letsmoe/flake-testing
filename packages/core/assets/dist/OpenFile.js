import { ws } from "./Shared.js";
function openFile(fileName, line, column) {
    var data = {
        file: fileName
    };
    if (line)
        data["line"] = line;
    if (column)
        data["column"] = column;
    ws.send(JSON.stringify({
        type: "POST",
        action: "OPEN_FILE",
        data: data
    }));
}
export { openFile };
//# sourceMappingURL=OpenFile.js.map