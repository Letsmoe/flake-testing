import { applyRef, Snowblind } from "@snowblind/core";

function variableMarkup(value: any, indent: number = 0, inline: boolean = false) {
	const style = {
		marginLeft: indent * 10
	}

	if (inline) style["display"] = "inline";

	let objectRef = applyRef();
	let fold = <span class="code fold" onclick={() => {
		objectRef.current.classList.toggle("folded");
	}}></span>

	if (typeof value === "string") {
		return <span class="code string">"{value}"</span>
	} else if (typeof value === "number") {
		return <span class="code number">{value}</span>
	} else if (typeof value === "object" && Array.isArray(value)) {
		return <div style={style} class="code array" ref={objectRef}>
			{fold}
			<span class="code open-bracket"></span>
			{value.map(x => {
				return variableMarkup(x, indent + 1)
			})}
			<span class="code closing-bracket"></span>
		</div>
	} else if (typeof value === "object") {
		return <div style={style} class="code object" ref={objectRef}>
			{fold}
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

export { markupCode, variableMarkup }