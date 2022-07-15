import { applyRef, applyState, Snowblind } from "@snowblind/core";
import { AssertionObject, OutputObject } from "../../dist";
import { markupCode, variableMarkup } from "./markup.js";
import { openFile } from "./OpenFile.js";

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
					<pre><code>{variableMarkup(item.snapshots.at(-1)?.scope)}</code></pre>
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
							<code style={{marginBottom: 10}}>{snapshot.event.name} = {variableMarkup(snapshot.event.value, 0, true)};</code>
							{markupCode(snapshot.context, snapshot.event.line)}
						</div>
					})
				}
				{item.snapshots.length == 0 ? <h3>No snapshots were captured during execution.</h3> : ""}
			</>
		}
		return <></>
	}
}

export { Section }