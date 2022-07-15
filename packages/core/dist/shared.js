export var CURRENT_VERSION = "0.0.1";
export function safe_exit() {
    process.exit(0);
}
export function error(message) {
    console.error(message);
    process.exit(1);
}
export var Reasons;
(function (Reasons) {
    Reasons[Reasons["JSON_PARSE_ERROR"] = 0] = "JSON_PARSE_ERROR";
})(Reasons || (Reasons = {}));
export var Properties;
(function (Properties) {
    Properties[Properties["DEFAULT_FILE_EXTENSION"] = 0] = "DEFAULT_FILE_EXTENSION";
    Properties[Properties["USE_REWRITE"] = 1] = "USE_REWRITE";
})(Properties || (Properties = {}));
//# sourceMappingURL=shared.js.map