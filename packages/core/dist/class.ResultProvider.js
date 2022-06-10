import * as chokidar from "chokidar";
var ResultProvider = /** @class */ (function () {
    /**
     * Attach a listener to the given folder where files can be picked up at a later time.
     * @param folder The folder where the test results will be stored.
     */
    function ResultProvider(folder) {
        var _this = this;
        this.listeners = new Map();
        chokidar.watch(folder).on("all", function (event, path) {
            _this.listeners.forEach(function (listener) {
                listener(event, path);
            });
        });
    }
    ResultProvider.prototype.attach = function (callback) {
        this.listeners.set(callback, callback);
    };
    ResultProvider.prototype.detach = function (callback) {
        this.listeners.delete(callback);
    };
    return ResultProvider;
}());
export { ResultProvider };
