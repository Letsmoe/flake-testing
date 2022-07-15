import { applyState, Snowblind } from "@snowblind/core";
import { formatDate, getTimeAgo } from "./Date.js";
import { openFile } from "./OpenFile.js";
import { Section } from "./Section.js";
function ItemDetails(props) {
    var offset = props.offset;
    var item = props.data[offset];
    var _a = applyState(0), section = _a[0], changeSection = _a[1];
    document.body.addEventListener("keydown", function (e) {
        if (e.target instanceof HTMLInputElement) {
            return;
        }
        if (["1", "2", "3"].indexOf(e.key) > -1) {
            changeSection(parseInt(e.key) - 1);
        }
    });
    return function () {
        if (item) {
            var date = new Date(item.startTime);
            var _a = item.result.assertions.reduce(function (acc, curr) {
                if (curr.result === true) {
                    return [acc[0], acc[1] + 1];
                }
                else {
                    return [acc[0] + 1, acc[1]];
                }
            }, [0, 0]), failed = _a[0], succeeded = _a[1];
            return (Snowblind.make("div", null,
                Snowblind.make("span", null,
                    formatDate(date),
                    " - ",
                    offset + 1,
                    " of ",
                    props.data.length),
                Snowblind.make("h2", null,
                    Snowblind.make("a", { onclick: function () {
                            openFile(item.inputFile);
                        } }, item.inputFile),
                    " - ",
                    getTimeAgo(date),
                    " ago"),
                Snowblind.make("div", { class: "row gap-md" },
                    Snowblind.make("button", { onclick: function () { return changeSection(0); } }, "General"),
                    Snowblind.make("button", { onclick: function () { return changeSection(1); } }, "Imports"),
                    Snowblind.make("button", { onclick: function () { return changeSection(2); } }, "Snapshots")),
                Snowblind.make("h3", null,
                    failed,
                    " of ",
                    failed + succeeded,
                    " tests failed ",
                    Snowblind.make("span", { class: "info" },
                        "(",
                        failed / (succeeded + failed) * 100,
                        "%)"),
                    "."),
                Snowblind.make(Section, { sectionIndex: section, data: item })));
        }
        else {
            return Snowblind.make("div", { class: "center justify-center" },
                Snowblind.make("h1", null, "Waiting for data..."));
        }
    };
}
export { ItemDetails };
//# sourceMappingURL=Details.js.map