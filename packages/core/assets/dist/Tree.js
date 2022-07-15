import { Snowblind } from "@snowblind/core";
import Branch from "./Branch.js";
function Tree(_a) {
    var data = _a.data, creator = _a.creator;
    return function () { return (Snowblind.make("div", { class: "tree" }, data.map(function (item) { return Snowblind.make(Branch, { key: item.id, item: item, level: 0, creator: creator }); }))); };
}
export default Tree;
//# sourceMappingURL=Tree.js.map