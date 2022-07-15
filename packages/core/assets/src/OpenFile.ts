import { ws } from "./Shared.js";

function openFile(fileName:string, line?: number, column?: number) {
	let data = {
		file: fileName
	}

	if (line) data["line"] = line;
	if (column) data["column"] = column;

	ws.send(JSON.stringify({
		type: "POST",
		action: "OPEN_FILE",
		data: data
	}))
}

export { openFile }