import { colarg } from "colarg";

const args = colarg(process.argv.slice(2))
			.option({
				name: "config",
				alias: "p",
				type: "string",
				description: "The path to the config file",
				defaults: "./flake.config.json"
			}).help().args;


export { args }