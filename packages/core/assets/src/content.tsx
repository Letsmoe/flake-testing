import { Snowblind, applyState, applyRef } from "@snowblind/core";
import { OutputObject } from "../../src/types/index";
import { getTimeAgo } from "./Date.js";
import { ItemDetails } from "./Details.js";
import { ws } from "./Shared.js";
import Tree from "./Tree.js";



function App() {
	const [data, setData] = applyState([]);
	const [offset, setOffsetState] = applyState(0);
	var root = "";

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
		root = json.data.root
		setData(json.data.results);
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

	const [filter, setFilter] = applyState("");
	const inputRef = applyRef();

	return () => {
		type TreeItem = {
			label: string,
			id: number,
			children: TreeItem[],
			time: number,
			isValid: boolean
		}
		// Convert the results list to a tree view of which test was in which directory.
		const tree = [{children: [], id: -1, label: "/"}]
		const intermediaryTree = {}
		const indexMap = {}
		var j = 0;
		data.forEach((point: OutputObject) => {
			let file = point.inputFile.replace(root, "")
			let parts = file.trim().split("/");

			if (parts.at(-1).substring(0, filter.length) != filter) {
				return
			}

			let curr = intermediaryTree;
			let currFinal = tree[0];
			let currIndex = indexMap
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				let x: TreeItem = {
					label: part,
					id: j,
					children: [],
					time: point.endTime,
					isValid: i === parts.length - 1
				}
				// We don't want to display folders twice, but results might be duplicated since they could have been executed at a different time.
				if (i !== parts.length - 1) {
					// This is not a file but a folder, push it to the intermediary.
					if (!curr.hasOwnProperty(part)) {
						curr[part] = {};
						currIndex[part] = currFinal.children.length
						currFinal.children.push(x)
						currFinal = x
					} else {
						currFinal = currFinal.children[currIndex[part]]
					}
					currIndex = currIndex[part]
					curr = curr[part];
				} else {
					currFinal.children.push(x)
				}
			}
			j++
		});
		
		function NodeCreator(item: TreeItem, level: number) {
			let time = item.time ? " (" + getTimeAgo(new Date(item.time)) + ")" : "";
			let style = {paddingLeft: level * 16}
			let img = `/images/file_type_${item.label.split(".").at(-1)}.svg`
			let icon = <img class="file-icon" src={img} />
			let folder_image = <img class="file-icon" src={`/images/folder_type_${item.label}.svg`} label="" onerror="this.style.display='none'" />
			let isNew = (item.isValid && (item.time > Date.now() - 60000));

			return (
				<>
					{
						item.isValid ? 
						<a style={style} onclick={() => setOffset(item.id)} class={(item.id == offset ? "selected center" : "center") + (isNew ? " new" : "")}>{icon}{item.label}{time}</a> : 
						<p style={style}>{folder_image}{item.label}</p>
					}
				</>
			)
		}

		const searchFile = () => {
			let start = inputRef.current.selectionStart
			let end = inputRef.current.selectionEnd
			let value = inputRef.current.value;
			setFilter(value);
			inputRef.current.value = filter;
			inputRef.current.setSelectionRange(start, end)
			inputRef.current.focus()
		}

		
		return (<>
			<div class="sidebar center">
				<div class="row gap-md">
					<button onclick={removeAll}>Remove All</button>
					<button onclick={runAll}>Run All</button>
				</div>
				<input type="text" placeholder="Search for a file..." oninput={searchFile} ref={inputRef}></input>
				<Tree data={tree[0].children} creator={NodeCreator} />
			</div>
			<div class="main">
				<ItemDetails data={data} offset={offset} />
			</div>
		</>
	)};
}

Snowblind.render(document.body, <App></App>);
