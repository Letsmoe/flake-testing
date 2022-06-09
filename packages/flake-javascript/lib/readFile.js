import * as fs from "fs";
const file = fs.readFileSync(process.cwd() + "/test.test.js");
console.log(file.toString());
