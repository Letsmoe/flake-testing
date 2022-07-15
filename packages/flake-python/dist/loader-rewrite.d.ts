#!/usr/bin/env node
/**
 * A loader is a function that takes a specific file path, modifies the contents of that file and returns new content.
 * This function is always called asynchronously since most processes of executing and altering a file can not be called synchronously.
 * A loader can be included in a config through a corresponding npm package like this:
 * ```json
 * {
 * 	"rules": [
 * 		{
 * 			"test": "{{file:js}}",
            "use": [
                {
                    "loader": "flake-javascript",
                    "options": {}
                }
            ]
 * 		}
 * 	]
 * }
 * ```
 *
 * @async
 */
declare function loader(): Promise<object>;
export { loader };
//# sourceMappingURL=loader-rewrite.d.ts.map