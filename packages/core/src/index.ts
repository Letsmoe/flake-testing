import { validateConfig } from "./config/validateConfig.js";
import { defaultConfig } from "./config/defaultConfig.js";
import { ResultReader } from "./class.ResultReader.js";
import { readConfig } from "./config/readConfig.js";

const WORKING_DIRECTORY = process.cwd();

readConfig(WORKING_DIRECTORY).then(config => {
	validateConfig(config);

	const resultReader = new ResultReader(config);
})