import { Snowblind } from "@snowblind/core";
function Branch(_a) {
    var key = _a.key, item = _a.item, level = _a.level, creator = _a.creator;
    var hasChildren = item.children && item.children.length !== 0;
    var renderBranches = function () {
        if (hasChildren) {
            var newLevel_1 = level + 1;
            return Snowblind.make(Snowblind.Fragment, null, item.children.map(function (child) {
                return Snowblind.make(Branch, { key: child.id, item: child, level: newLevel_1, creator: creator });
            }));
        }
    };
    return function () { return (Snowblind.make(Snowblind.Fragment, null,
        creator(item, level),
        hasChildren ? renderBranches() : "")); };
}
export default Branch;
//# sourceMappingURL=Branch.js.map