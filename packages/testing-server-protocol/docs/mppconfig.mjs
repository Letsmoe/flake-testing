export default {
	outDir: "../out/",
	rootDir: "./src/",
	resultModifier: {
		"before": (result) => {
			return result;
		}
	},
	watch: true,
	wrapper: function(head, body,metadata, md) {
		return `<!DOCTYPE html><html><head>${head}${this.generateMetadata(metadata)}</head><body><a href="/">Home</a><div class="content">${body}</div></body></html>`
	},
	linkValidation: true,
	serve: true
}