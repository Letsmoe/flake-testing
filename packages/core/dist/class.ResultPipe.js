import * as chokidar from "chokidar";
import { readConfig } from "./config/readConfig.js";
import { args } from "./args.js";
import { validateConfig } from "./config/validateConfig.js";
import * as path from "path";
import * as fs from "fs";
import { generateRandomString } from "./utils/randomString.js";
var ResultPipe = /** @class */ (function () {
    function ResultPipe() {
        var _this = this;
        this.listeners = new Map();
        this.channels = {};
        var configPath = path.dirname(path.join(process.cwd(), args.config));
        // Read the config file.
        readConfig(configPath).then(function (config) {
            validateConfig(config);
            _this.config = config;
            _this.dir = path.join(process.cwd(), config.dir);
            _this.createTempFolder();
            // Start watching the folder for changes in case the watch parameter was given.
            if (config.watch) {
                chokidar.watch(_this.dir).on("all", function (event, path) {
                    _this.listeners.forEach(function (listener) {
                        listener(event, path);
                    });
                });
            }
            _this.ready();
        });
    }
    ResultPipe.prototype.ready = function () { };
    ResultPipe.prototype.attach = function (callback) {
        this.listeners.set(callback, callback);
    };
    ResultPipe.prototype.detach = function (callback) {
        this.listeners.delete(callback);
    };
    /**
     * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
     * @date 6/8/2022 - 11:34:52 PM
     *
     * @private
     */
    ResultPipe.prototype.createTempFolder = function () {
        var FOLDER_NAME = ".flake";
        var TEMP_FOLDER = path.join(this.dir, FOLDER_NAME);
        // Create the folder if it doesn't exist already.
        if (!fs.existsSync(TEMP_FOLDER)) {
            fs.mkdirSync(TEMP_FOLDER);
        }
        // Now create the subfolders we need to keep everything organized.
        /**
         * The cache folder is where all bundled files will be stored,
         * this will ensure we don't recompile whole projects just because of a single change to a file that didn't even matter to us.
         */
        var CACHE_FOLDER = path.join(TEMP_FOLDER, "cache");
        /**
         * The result folder is where all result files are being stored,
         * their names correspond to their unique job identifiers created through a sha256 hash on the test file.
         */
        var RESULT_FOLDER = path.join(TEMP_FOLDER, "results");
        // Create both folders if they don't already exist.
        if (!fs.existsSync(CACHE_FOLDER)) {
            fs.mkdirSync(CACHE_FOLDER);
        }
        if (!fs.existsSync(RESULT_FOLDER)) {
            fs.mkdirSync(RESULT_FOLDER);
        }
    };
    /**
     * A function to open a new channel for writing to a file with a unique job identifier.
     * @returns A unique identifier that may only be used for writing a file once, will be deactivated afterwards.
     */
    ResultPipe.prototype.open = function () {
        var random;
        do {
            random = Date.now().toString() + "__" + generateRandomString(4);
        } while (random in this.channels);
        this.channels[random] = true;
        return random;
    };
    ResultPipe.prototype.getChannel = function (channel) {
        var _this = this;
        if (channel in this.channels) {
            var file_1 = path.join(this.dir, ".flake", "results", channel);
            if (fs.existsSync(file_1)) {
                return {
                    getPath: function () { return file_1; },
                    getContent: function () { return fs.readFileSync(file_1, "utf8"); },
                    stream: function () { return fs.createReadStream(file_1); },
                    asJSON: function () { return JSON.parse(fs.readFileSync(file_1, "utf8")); },
                    dump: function () { return console.log(fs.readFileSync(file_1, "utf8")); },
                    delete: function () {
                        fs.unlinkSync(file_1);
                        delete _this.channels[channel];
                    }
                };
            }
        }
        else {
            console.error("Channel could not be found.");
        }
    };
    /**
     * A function to write the results of a test to a file, then notifying all listeners of the event and closing the channel afterwards.
     * @param identifier A unique identifier corresponding to an open channel.
     * @param content The content to write to the file.
     */
    ResultPipe.prototype.write = function (identifier, content) {
        var _this = this;
        // Check if the identifier channel is still open, an identifier may only be used once.
        if (identifier in this.channels && this.channels[identifier] === true) {
            // Convert content to string if it is an object.
            if (typeof content === "object") {
                content = JSON.stringify(content);
            }
            // Write the content to the file.
            fs.writeFileSync(path.join(this.dir, ".flake", "results", identifier), content);
            // Notify all listeners of the event.
            this.listeners.forEach(function (listener) {
                listener("write", path.join(_this.dir, ".flake", "results", identifier));
            });
            // Close the channel.
            this.channels[identifier] = false;
        }
        else if (!(identifier in this.channels)) {
            throw new Error("The identifier ".concat(identifier, " has never existed."));
        }
        else {
            throw new Error("The identifier ".concat(identifier, " has already been closed."));
        }
    };
    ResultPipe.prototype.getCacheFolder = function () {
        return path.join(this.dir, ".flake", "cache");
    };
    return ResultPipe;
}());
export { ResultPipe };
//# sourceMappingURL=class.ResultPipe.js.map