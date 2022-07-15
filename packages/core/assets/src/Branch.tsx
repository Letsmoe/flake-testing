import { Snowblind } from "@snowblind/core";

function Branch({ key, item, level, creator }) {
	const hasChildren = item.children && item.children.length !== 0;
	const renderBranches = () => {
		if (hasChildren) {
			const newLevel = level + 1;
	
			return <>
				{item.children.map(child => {
					return <Branch key={child.id} item={child} level={newLevel} creator={creator} />
				})}
			</>
		}
	}

	return () => (
		<>
			{creator(item, level)}
			{hasChildren ? renderBranches() : ""}
		</>
	)
}

export default Branch