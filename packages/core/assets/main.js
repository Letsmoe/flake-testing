const ws = new WebSocket('ws://localhost:8088');

ws.onopen = (event) => {

}

ws.onmessage = (event) => {
	let json = JSON.parse(event.data);
	json.data.forEach(obj => {
		console.log(obj);
		let p = document.createElement('p');
		p.innerText = obj.inputFile
		document.body.querySelector(".sidebar").appendChild(p)
	});
}