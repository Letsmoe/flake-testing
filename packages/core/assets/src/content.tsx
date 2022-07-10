import { Snowblind, applyState, applyRef } from "@snowblind/core";
import { AssertionObject, OutputObject } from "../../src/types/index";

const ws = new WebSocket("ws://localhost:8088");

function App() {
	const [data, setData] = applyState([]);
	const [offset, setOffsetState] = applyState(0);

	const setOffset = (newOffset: number) => {
		if (newOffset >= data.length) {
			setOffsetState(0);
		} else if (newOffset < 0) {
			setOffsetState(data.length - 1);
		} else {
			setOffsetState(newOffset);
		}
	};

	ws.onmessage = (event) => {
		let json = JSON.parse(event.data);
		setData(json.data);
	};

	document.body.addEventListener("keydown", (e) => {
		if (e.target instanceof HTMLInputElement) {
			return
		}
		if (e.key == "e") {
			setOffset(offset + 1)
		} else if (e.key == "q") {
			setOffset(offset - 1)
		}
	})

	function removeAll() {
		ws.send(JSON.stringify({
			type: "DELETE",
			action: "REMOVE_ALL",
			data: {}
		}))
	}

	function runAll() {
		ws.send(JSON.stringify({
			type: "POST",
			action: "RUN_ALL",
			data: {}
		}))
	}

	return () => (
		<>
			<div class="sidebar center">
				<div class="row gap-md">
					<button onclick={removeAll}>Remove All</button>
					<button onclick={runAll}>Run All</button>
				</div>
				{data.map((x: any, i: number) => {
					let className = "item-select" + (i == offset ? " selected" : "");
					return <div class={className} onclick={() => setOffset(i)}>
						<a>{x.inputFile.split("/").at(-1)}</a>
						<span>{getTimeAgo(new Date(x.startTime))} ago</span>
						{(x.startTime > Date.now() - 60000) ? <span class="info">New</span> : ""}
					</div>
				})}
			</div>
			<div class="main">
				<ItemDetails data={data} offset={offset} />
			</div>
		</>
	);
}

function ItemDetails(props: { data: OutputObject[]; offset: number }) {
	let offset = props.offset;
	let item: OutputObject = props.data[offset];

	const [section, changeSection] = applyState(0)
	document.body.addEventListener("keydown", (e) => {
		if (e.target instanceof HTMLInputElement) {
			return
		}
		if (["1", "2", "3"].indexOf(e.key) > -1) {
			changeSection(parseInt(e.key) - 1)
		}
	})

	return () => {
		if (item) {
			let date = new Date(item.startTime);
			let [failed, succeeded] = item.result.assertions.reduce((acc, curr) => {
				if (curr.result === true) {
					return [acc[0], acc[1] + 1]
				} else {
					return [acc[0] + 1, acc[1]]
				}
			}, [0, 0])

			return (
				<div>
					<span>{formatDate(date)} - {offset + 1} of {props.data.length}</span>
					<h2><a onclick={() => {
						openFile(item.inputFile)
					}}>{item.inputFile}</a> - {getTimeAgo(date)} ago</h2>
					<div class="row gap-md">
						<button onclick={() => changeSection(0)}>General</button>
						<button onclick={() => changeSection(1)}>Imports</button>
						<button onclick={() => changeSection(2)}>Snapshots</button>
					</div>
					<h3>{failed} of {failed + succeeded} tests failed <span class="info">({failed / (succeeded + failed) * 100}%)</span>.</h3>
					<Section sectionIndex={section} data={item}></Section>
				</div>
			);
		} else {
			return <div class="center justify-center"><h1>Waiting for data...</h1></div>;
		}
	};
}

function openFile(fileName:string, line?: number, column?: number) {
	let data = {
		file: fileName
	}

	if (line) data["line"] = line;
	if (column) data["column"] = column;

	ws.send(JSON.stringify({
		type: "POST",
		action: "OPEN_FILE",
		data: data
	}))
}

function Section(props: {sectionIndex: number, data: OutputObject}) {
	const [index, setTestIndex] = applyState(0);
	const assertions = props.data.result.assertions
	const [visible, setVisible] = applyState(Object.entries(assertions));
	var searchTerm = "";
	const filterRef = applyRef();
	let item = props.data;
	let groups = item.result.groups;
	let groupMap = {};
	for (const group of Object.keys(groups)) {
		for (const assertion of groups[group]) {
			groupMap[assertion] = group;
		}
	}

	const filterGroups = () => {
		let value = filterRef.current.value;
		let start = filterRef.current.selectionStart
		let end = filterRef.current.selectionEnd
		let newVisible: {[key: string]: AssertionObject} = {};
		assertions.forEach((assertion, i) => {
			// Get the group of the assertion and filter based on that.
			if (groupMap[i] && groupMap[i].substring(0, value.length) === value) {
				newVisible[i] = assertion;
			}
		});
		searchTerm = value
		setVisible(Object.entries(newVisible));
		filterRef.current.setSelectionRange(start, end)
		filterRef.current.focus()
	}

	return () => {
		if (props.sectionIndex == 0) {
			let curr = assertions[index];
			let success = curr.result ? "success" : "failure";
			let fileName = item.inputFile.split("/").at(-1)
			let contentLength = curr.content.length

			return (<div>
				<input type="text" placeholder="Filter by groups..." oninput={() => filterGroups()} ref={filterRef} value={searchTerm}></input>
				<div class="result-container">
					{
						visible.map(([i, assertion]) => {
							let className = "result column gap-sm " + (assertion.result ? "success" : "failure") + (i == index ? " selected" : "");
							return <div class={className} onclick={() => setTestIndex(i)}>
								<a onclick={() => {
									openFile(item.inputFile, assertion.line + 1, contentLength)
								}}>{fileName}#{assertion.line + 1}</a>
								<p><code>{assertion.content}</code></p>
								<p>{assertion.description || "No description provided."}</p>
								<p>{groupMap[i] ? <span class="info">{groupMap[i]}</span> : ""}</p>
							</div>
						})
					}
				</div>
				<div class="detail-container" style={{"border": "1px solid #ddd", padding: "10px", borderRadius: 4}}>
					<h3><a onclick={() => {
						openFile(item.inputFile, curr.line + 1, contentLength)
					}}>{fileName}#{curr.line + 1}</a> - <span class={success} style={{textTransform: "uppercase"}}>{success}</span></h3>
					<p style={{marginBottom: 10}}>{curr.description || "No description provided."}</p>
					{markupCode(curr.context, curr.line)}
					<h3>Scope:</h3>
					<pre><code>{JSON.stringify(item.snapshots.at(-1)?.scope, null, 2)}</code></pre>
				</div>
			</div>)
		} else  if (props.sectionIndex == 1) {
			return <>
				{
					item.imports.map((value, i) => {
						return <div class="column gap-sm">
							<h3>{value.source} - Line {value.line}</h3>
							<div class="result-container">
								{
									value.specifiers.map((x) => {
										let className = "result column gap-sm " + (x.default ? "info" : "");
										return <div class={className}>
											<p>{x.name}</p>
										</div>
									})
								}
							</div>
						</div>
					})
				}
				{
					item.imports.length === 0 ? <h3>There are no imports here.</h3> : ""
				}
			</>
		} else if (props.sectionIndex == 2) {
			return <>
				{
					item.snapshots.map((snapshot, i) => {
						return <div class="snapshot">
							<code style={{marginBottom: 10}}>{snapshot.event.name} = {variableMarkup(snapshot.event.value, 0, true)}</code>
							{markupCode(snapshot.context, snapshot.event.line)}
						</div>
					})
				}
			</>
		}
		return <></>
	}
}

var x = [
	"nice",
	4, 
	[
		"arrays", 
		"in", 
		1, 
		{
			"object": true
		}
	]
]

function variableMarkup(value: any, indent: number = 0, inline: boolean = false) {
	const style = {
		marginLeft: indent * 10
	}

	if (inline) style["display"] = "inline";

	if (typeof value === "string") {
		return <span class="code string">"{value}"</span>
	} else if (typeof value === "number") {
		return <span class="code number">{value}</span>
	} else if (typeof value === "object" && Array.isArray(value)) {
		return <div style={style} class="code array">
			<span class="code open-bracket"></span>
			{value.map(x => {
				return variableMarkup(x, indent + 1)
			})}
			<span class="code closing-bracket"></span>
		</div>
	} else if (typeof value === "object") {
		return <div style={style} class="code object">
			<span class="code open-brace"></span>
			{
				Object.entries(value).map(([key, val]) => {
					return <code class="line">
						<span class="code string key">"{key}"</span>
						{variableMarkup(val, indent + 1)}
					</code>
				})
			}
			<span class="code closing-brace"></span>
		</div>
	} else {
		return <span class="code boolean">{value}</span>
	}
}


function markupCode(code: {[key: string]: string}, markupLine: number) {
	// We receive an object with line numbers as keys and contents as values.
	return (<pre>
		{
			Object.entries(code).map(([lineNumber, lineContent]) => {
				if (parseInt(lineNumber) === markupLine) {
					return <code class="highlight-line"><span class="line-number">{lineNumber}</span>{lineContent}</code>
				}
				return <code><span class="line-number">{lineNumber}</span>{lineContent}</code>
			})
		}
	</pre>)
}

/**
 * A function to return how far another date is away from the current date.
 * @date 7/6/2022 - 12:52:04 PM
 *
 * @param {Date} date
 */
function getTimeAgo(date: Date) {
	// @ts-ignore
	var seconds = Math.floor((new Date() - date) / 1000);

	var interval = seconds / 31536000;

	const mod = (name: string) => {
		let floor = Math.floor(interval);
		return floor + " " + name + (floor > 1 ? "s": "");
	}
	interval = seconds / 31536000;
	if (interval > 1) {
		return mod("year");
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return mod("month");
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return mod("day");
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return mod("hour");
	}
	interval = seconds / 60;
	if (interval > 1) {
		return mod("minute");
	}
	interval = seconds
	return mod("second");
}

function formatDate(date: Date) {
	const pad = (x: string | number) => x.toString().trim().padStart(2, "0");

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	return `${months[date.getMonth()]} ${pad(
		date.getDate()
	)} ${date.getFullYear()} ${pad(date.getHours())}:${pad(
		date.getMinutes()
	)}:${pad(date.getSeconds())}`;
}

Snowblind.render(document.body, <App></App>);
