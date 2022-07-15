import { Snowblind } from "@snowblind/core";
import Branch from "./Branch.js"

function Tree({ data, creator }) {
	return () => (
		<div class="tree">
			{data.map(item => <Branch key={item.id} item={item} level={0} creator={creator} />)}
		</div>
	)
}

export default Tree