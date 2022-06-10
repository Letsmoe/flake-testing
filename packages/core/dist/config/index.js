import { validateConfig } from "./validateConfig.js";
import { readConfig } from "./readConfig.js";
var WORKING_DIRECTORY = process.cwd();
var config = {
    onDidValidate: function () { }
};
readConfig(WORKING_DIRECTORY).then(function (conf) {
    validateConfig(conf);
    Object.assign(config, conf);
    config.onDidValidate(conf);
});
export { config, WORKING_DIRECTORY };
//# sourceMappingURL=index.js.map