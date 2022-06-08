import { validateConfig } from "./config/validateConfig.js";
import { defaultConfig } from "./config/defaultConfig.js";
import { readConfig } from "./config/readConfig.js";

const WORKING_DIRECTORY = process.cwd();

readConfig(WORKING_DIRECTORY).then(config => {
	console.log(validateConfig(config))
})