import * as fs from 'fs';
export function getUtils() {
    var _this = this;
    return {
        getConfig: function () {
            return _this.config;
        },
        getOptions: function () {
            return _this.options || {};
        },
        getFileContent: function () {
            return fs.readFileSync(_this.absolutePath, "utf-8");
        }
    };
}
//# sourceMappingURL=ModuleUtils.js.map