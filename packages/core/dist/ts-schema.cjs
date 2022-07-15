import * as path from "path";
import { fileURLToPath } from 'url';
import * as fs from "fs";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as TJS from "typescript-json-schema";
// optionally pass argument to schema generator
var settings = {
    required: true,
};
// optionally pass ts compiler options
var compilerOptions = {
    strictNullChecks: true,
};
// optionally pass a base path
var basePath = "./";
var program = TJS.getProgramFromFiles([path.resolve("./config/config.type.d.ts")], compilerOptions, basePath);
// We can either get the schema for one file and one type...
var schema = TJS.generateSchema(program, "FlakeConfigObject", settings);
fs.writeFileSync(path.join(__dirname, "../schema/schema.json"), JSON.stringify(schema, null, 4));
//# sourceMappingURL=ts-schema.cjs.map