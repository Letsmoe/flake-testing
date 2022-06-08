import * as path from "path";
import * as fs from "fs";
import { config } from "./config/index.js";
var ResultReader = /** @class */ (function () {
    function ResultReader(config) {
        this.config = config;
        this.createTempFolder();
    }
    /**
     * A method to create a temporary folder where test results will be stored and passed around between the executor and the server.
     * @date 6/8/2022 - 11:34:52 PM
     *
     * @private
     */
    ResultReader.prototype.createTempFolder = function () {
        var FOLDER_NAME = ".flake";
        var TEMP_FOLDER = path.join(config.dir, FOLDER_NAME);
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
    ResultReader.prototype.read = function () {
    };
    return ResultReader;
}());
export { ResultReader };
