// Fetch from a public API
let url = "https://datausa.io/api/data?drilldowns=Nation&measures=Population";

fetch(url).then(response => {
	response.json().then(json => {
		snap: json;

		// @every Check if the response has all required fields.
		$_fields: json.hasOwnProperty("source");
		$_fields: json.hasOwnProperty("data");
		// Check if the source is an array.
		$_type: Array.isArray(json["source"]);
		$_fields: json["source"].length == 1
	})
})