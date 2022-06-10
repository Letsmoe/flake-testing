function main() {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(42)
		}, 5000	)
	})
}


main().then(function(value) {
	$:
		value == 42;
})