import * as jsonschema from "jsonschema";
import { __dirname } from "../dirname.js";
import * as fs from "fs";
import {join} from "path"
import { error } from "../utils/error.js";

function validateConfig(config: object): boolean | never {
	const validator = new jsonschema.Validator();
	// Load the schema into memory, all schema files can be found in the /schema/ directory
	const schema = fs.readFileSync(join(__dirname, "/../schema/config.schema.json"), "utf8");

	// Validate the config against the schema
	const result = validator.validate(config, JSON.parse(schema));

	if (!result.valid) {
		error(result.errors[0].property + " " + result.errors[0].message);
		process.exit(1)
	}

	return result.valid;
}

export { validateConfig }