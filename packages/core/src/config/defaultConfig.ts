import { FlakeConfigObject } from "./config.type.js"

const defaultConfig: FlakeConfigObject = {
	exclude: [".*node_modules.*"],
	watch: false,
	watchOptions: {
		poll: 500,
		aggregateTimeout: 1000,
		ignored: []
	},
	dir: "./",
	own: {},
	strictCompare: false,
	contextualLines: 3
}

export { defaultConfig }