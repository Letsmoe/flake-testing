import { colarg } from "colarg";
var args = colarg(process.argv.slice(2))
    .option({
    name: "config",
    alias: "p",
    type: "string",
    description: "The path to the config file",
    defaults: "./flake.config.json"
}).help().args;
export { args };
//# sourceMappingURL=args.js.map