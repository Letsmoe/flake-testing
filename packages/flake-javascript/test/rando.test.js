import defaultImport, { main } from "./module.js"

let result = main();
// @every We're testing the "main" function which returns 42 when called.
var x = 5
$: typeof result === "string"
$: result < 44