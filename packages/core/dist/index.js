import { validateConfig } from "./config/validateConfig.js";
import { ResultReader } from "./class.ResultReader.js";
import { readConfig } from "./config/readConfig.js";
var WORKING_DIRECTORY = process.cwd();
readConfig(WORKING_DIRECTORY).then(function (config) {
    validateConfig(config);
    var resultReader = new ResultReader(config);
});
