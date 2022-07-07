const path = require('path');

module.exports = [{
	mode: "production",
	entry: "./assets/dist/content.js",
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