import { applyRef, applyState, Snowblind } from "@snowblind/core";
import { markupCode, variableMarkup } from "./markup.js";
import { openFile } from "./OpenFile.js";
function Section(props) {
    var _a = applyState(0), index = _a[0], setTestIndex = _a[1];
    var assertions = props.data.result.assertions;
    var _b = applyState(Object.entries(assertions)), visible = _b[0], setVisible = _b[1];
    var searchTerm = "";
    var filterRef = applyRef();
    var item = props.data;
    var groups = item.result.groups;
    var groupMap = {};
    for (var _i = 0, _c = Object.keys(groups); _i < _c.length; _i++) {
        var group = _c[_i];
        for (var _d = 0, _e = groups[group]; _d < _e.length; _d++) {
            var assertion = _e[_d];
            groupMap[assertion] = group;
        }
    }
    var filterGroups = function () {
        var value = filterRef.current.value;
        var start = filterRef.current.selectionStart;
        var end = filterRef.current.selectionEnd;
        var newVisible = {};
        assertions.forEach(function (assertion, i) {
            // Get the group of the assertion and filter based on that.
            if (groupMap[i] && groupMap[i].substring(0, value.length) === value) {
                newVisible[i] = assertion;
            }
        });
        searchTerm = value;
        setVisible(Object.entries(newVisible));
        filterRef.current.setSelectionRange(start, end);
        filterRef.current.focus();
    };
    return function () {
        var _a;
        if (props.sectionIndex == 0) {
            var curr_1 = assertions[index];
            var success = curr_1.result ? "success" : "failure";
            var fileName_1 = item.inputFile.split("/").at(-1);
            var contentLength_1 = curr_1.content.length;
            return (Snowblind.make("div", null,
                Snowblind.make("input", { type: "text", placeholder: "Filter by groups...", oninput: function () { return filterGroups(); }, ref: filterRef, value: searchTerm }),
                Snowblind.make("div", { class: "result-container" }, visible.map(function (_a) {
                    var i = _a[0], assertion = _a[1];
                    var className = "result column gap-sm " + (assertion.result ? "success" : "failure") + (i == index ? " selected" : "");
                    return Snowblind.make("div", { class: className, onclick: function () { return setTestIndex(i); } },
                        Snowblind.make("a", { onclick: function () {
                                openFile(item.inputFile, assertion.line + 1, contentLength_1);
                            } },
                            fileName_1,
                            "#",
                            assertion.line + 1),
                        Snowblind.make("p", null,
                            Snowblind.make("code", null, assertion.content)),
                        Snowblind.make("p", null, assertion.description || "No description provided."),
                        Snowblind.make("p", null, groupMap[i] ? Snowblind.make("span", { class: "info" }, groupMap[i]) : ""));
                })),
                Snowblind.make("div", { class: "detail-container", style: { "border": "1px solid #ddd", padding: "10px", borderRadius: 4 } },
                    Snowblind.make("h3", null,
                        Snowblind.make("a", { onclick: function () {
                                openFile(item.inputFile, curr_1.line + 1, contentLength_1);
                            } },
                            fileName_1,
                            "#",
                            curr_1.line + 1),
                        " - ",
                        Snowblind.make("span", { class: success, style: { textTransform: "uppercase" } }, success)),
                    Snowblind.make("p", { style: { marginBottom: 10 } }, curr_1.description || "No description provided."),
                    markupCode(curr_1.context, curr_1.line),
                    Snowblind.make("h3", null, "Scope:"),
                    Snowblind.make("pre", null,
                        Snowblind.make("code", null, variableMarkup((_a = item.snapshots.at(-1)) === null || _a === void 0 ? void 0 : _a.scope))))));
        }
        else if (props.sectionIndex == 1) {
            return Snowblind.make(Snowblind.Fragment, null,
                item.imports.map(function (value, i) {
                    return Snowblind.make("div", { class: "column gap-sm" },
                        Snowblind.make("h3", null,
                            value.source,
                            " - Line ",
                            value.line),
                        Snowblind.make("div", { class: "result-container" }, value.specifiers.map(function (x) {
                            var className = "result column gap-sm " + (x.default ? "info" : "");
                            return Snowblind.make("div", { class: className },
                                Snowblind.make("p", null, x.name));
                        })));
                }),
                item.imports.length === 0 ? Snowblind.make("h3", null, "There are no imports here.") : "");
        }
        else if (props.sectionIndex == 2) {
            return Snowblind.make(Snowblind.Fragment, null,
                item.snapshots.map(function (snapshot, i) {
                    return Snowblind.make("div", { class: "snapshot" },
                        Snowblind.make("code", { style: { marginBottom: 10 } },
                            snapshot.event.name,
                            " = ",
                            variableMarkup(snapshot.event.value, 0, true),
                            ";"),
                        markupCode(snapshot.context, snapshot.event.line));
                }),
                item.snapshots.length == 0 ? Snowblind.make("h3", null, "No snapshots were captured during execution.") : "");
        }
        return Snowblind.make(Snowblind.Fragment, null);
    };
}
export { Section };
//# sourceMappingURL=Section.js.map