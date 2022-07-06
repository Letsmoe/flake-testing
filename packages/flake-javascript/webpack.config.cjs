const path = require('path');

module.exports = [{
	mode: "production",
	entry: "./lib/executeFile.js",
	experiments: {
		outputModule: true
	},
	output: {
		filename: "index.min.js",
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: "module"
		}
	}
}];