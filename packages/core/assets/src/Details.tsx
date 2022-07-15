import { applyState, Snowblind } from "@snowblind/core";
import { OutputObject } from "../../dist";
import { formatDate, getTimeAgo } from "./Date.js";
import { openFile } from "./OpenFile.js";
import { Section } from "./Section.js";

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

export { ItemDetails }