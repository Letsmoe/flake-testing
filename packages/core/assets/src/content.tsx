import { Snowblind, applyState } from "@snowblind/core";
import { ImportObject, OutputObject } from "../../src/types/index";

function App() {
	const [data, setData] = applyState([]);
	const [offset, setOffsetState] = applyState(0);

	const ws = new WebSocket("ws://localhost:8088");

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
		if (e.key == "e") {
			setOffset(offset + 1)
		} else if (e.key == "q") {
			setOffset(offset - 1)
		}
	})

	return () => (
		<>
			<div class="sidebar">
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
		if (["1", "2", "3"].indexOf(e.key) > -1) {
			changeSection(parseInt(e.key) - 1)
		}
	})

	return () => {
		if (item) {
			let date = new Date(item.startTime);

			return (
				<div>
					<h3>{item.inputFile}</h3>
					<span>
						{offset + 1} of {props.data.length}
					</span>
					<span>
						{formatDate(date)} - {getTimeAgo(date)} ago
					</span>
					<div class="row gap-md">
						<button onclick={() => changeSection(0)}>General</button>
						<button onclick={() => changeSection(1)}>Imports</button>
						<button onclick={() => changeSection(2)}>Snapshots</button>
					</div>
					<Section sectionIndex={section} data={item}></Section>
				</div>
			);
		} else {
			return <h2>Waiting for data...</h2>;
		}
	};
}

function Section(props: {sectionIndex: number, data: OutputObject}) {
	return () => {
		let item = props.data;
		if (props.sectionIndex == 0) {
			return <>
				{
					item.result.assertions.map((assertion, i: number) => {
						return <div class="result">
							<p>Content: <code>{assertion.content}</code></p>
							<p>Description: {assertion.description}</p>
							<p>Line: {assertion.line}</p>
							<p>Status: {assertion.result === true ? <span class="success">Success</span> : <span class="failure">Failure</span>}</p>
						</div>
					})
				}
			</>
		} else  if (props.sectionIndex == 1) {
			return <>
				{
					item.imports.map((value, i) => {
						return <>
							<h3>{value.source} - Line {value.line}</h3>
							{
								value.specifiers.map((x) => {
									return <div class="indent row gap-lg center">
										<b>{x.name}</b>
										{x.default ? <span class="info">Default Import</span> : ""}
									</div>
								})
							}
						</>
					})
				}
				{
					item.imports.length === 0 ? <h2>There are no imports here.</h2> : ""
				}
			</>
		} else if (props.sectionIndex == 2) {
			return <>
				{
					item.snapshots.map((snapshot, i) => {
						return <div class="snapshot">
							<pre>{i + 1}. <code>{snapshot.event.type} {snapshot.event.name} = {snapshot.event.value}</code></pre>
						</div>
					})
				}
			</>
		}
		return <></>
	}
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

	if (interval > 1) {
		return Math.floor(interval) + " years";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + " months";
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + " days";
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + " hours";
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + " minutes";
	}
	return Math.floor(seconds) + " seconds";
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

Snowblind.render(document.body, <App />);
