import { validateConfig } from "./config/validateConfig.js";
import { readConfig } from "./config/readConfig.js";
var WORKING_DIRECTORY = process.cwd();
readConfig(WORKING_DIRECTORY).then(function (config) {
    console.log(validateConfig(config));
});
