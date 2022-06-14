import * as fs from "fs";
var FileExecutor = /** @class */ (function () {
    function FileExecutor(rewriter, executor) {
        this.rewriter = rewriter;
        this.executor = executor;
    }
    FileExecutor.prototype.execute = function (file, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.executor(file, options, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    };
    FileExecutor.prototype.collectFiles = function (matcher, config) {
        function dirRead(path) {
            var files = [];
            fs.readdirSync(config.dir).forEach(function (file) {
                if (fs.statSync(path).isDirectory()) {
                    files = files.concat(dirRead(path));
                }
                else {
                    if (matcher.test(file)) {
                        files.push(path);
                    }
                }
            });
            return files;
        }
        return dirRead(config.dir);
    };
    return FileExecutor;
}());
export { FileExecutor };
//# sourceMappingURL=class.FileExecutor.js.map