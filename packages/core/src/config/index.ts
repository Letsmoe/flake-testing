import { validateConfig } from "./validateConfig.js";
import { defaultConfig } from "./defaultConfig.js";
import { readConfig } from "./readConfig.js";
import { FlakeConfigObject, SharedConfigObject } from "./config.type.js";



const WORKING_DIRECTORY = process.cwd();
const config: SharedConfigObject = {
	onDidValidate: () => {}
};

readConfig(WORKING_DIRECTORY).then(conf => {
	validateConfig(conf);
	Object.assign(config, conf);
	config.onDidValidate(conf);
})

export { config, WORKING_DIRECTORY };