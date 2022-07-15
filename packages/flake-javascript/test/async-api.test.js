import { assert, snap } from "flake-javascript";

// Fetch from a public API
let url = "https://datausa.io/api/data?drilldowns=Nation&measures=Population";

fetch(url).then(response => {
	response.json().then(json => {
		snap(json);

		// @every Check if the response has all required fields.
		assert(json.hasOwnProperty("source"));
		assert(json.hasOwnProperty("data"))
		// Check if the source is an array.
		assert(Array.isArray(json["source"]))
		assert(json["source"].length == 1)
	})
})