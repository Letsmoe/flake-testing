import * as path from "path";
import { fileURLToPath } from 'url';
import * as fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import * as TJS from "typescript-json-schema";

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
	required: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
	strictNullChecks: true,
};

// optionally pass a base path
const basePath = "./";

const program = TJS.getProgramFromFiles(
	[path.resolve("./config/config.type.d.ts")],
	compilerOptions,
	basePath
);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, "FlakeConfigObject", settings);

fs.writeFileSync(path.join(__dirname, "../schema/config.schema.json"), JSON.stringify(schema, null, 4));