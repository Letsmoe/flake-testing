import { FlakeConfigObject } from "./config.type"

const defaultConfig: FlakeConfigObject = {
	exclude: [],
	watch: false,
	watchOptions: {
		poll: 500,
		aggregateTimeout: 1000,
		ignored: []
	},
	dir: "./",
	own: {}
}

export { defaultConfig }