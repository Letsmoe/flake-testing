import { Snowblind, applyState, applyRef } from "@snowblind/core";
import { getTimeAgo } from "./Date.js";
import { ItemDetails } from "./Details.js";
import { ws } from "./Shared.js";
import Tree from "./Tree.js";
function App() {
    var _a = applyState([]), data = _a[0], setData = _a[1];
    var _b = applyState(0), offset = _b[0], setOffsetState = _b[1];
    var root = "";
    var setOffset = function (newOffset) {
        if (newOffset >= data.length) {
            setOffsetState(0);
        }
        else if (newOffset < 0) {
            setOffsetState(data.length - 1);
        }
        else {
            setOffsetState(newOffset);
        }
    };
    ws.onmessage = function (event) {
        var json = JSON.parse(event.data);
        root = json.data.root;
        setData(json.data.results);
    };
    document.body.addEventListener("keydown", function (e) {
        if (e.target instanceof HTMLInputElement) {
            return;
        }
        if (e.key == "e") {
            setOffset(offset + 1);
        }
        else if (e.key == "q") {
            setOffset(offset - 1);
        }
    });
    function removeAll() {
        ws.send(JSON.stringify({
            type: "DELETE",
            action: "REMOVE_ALL",
            data: {}
        }));
    }
    function runAll() {
        ws.send(JSON.stringify({
            type: "POST",
            action: "RUN_ALL",
            data: {}
        }));
    }
    var _c = applyState(""), filter = _c[0], setFilter = _c[1];
    var inputRef = applyRef();
    return function () {
        // Convert the results list to a tree view of which test was in which directory.
        var tree = [{ children: [], id: -1, label: "/" }];
        var intermediaryTree = {};
        var indexMap = {};
        var j = 0;
        data.forEach(function (point) {
            var file = point.inputFile.replace(root, "");
            var parts = file.trim().split("/");
            if (parts.at(-1).substring(0, filter.length) != filter) {
                return;
            }
            var curr = intermediaryTree;
            var currFinal = tree[0];
            var currIndex = indexMap;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                var x = {
                    label: part,
                    id: j,
                    children: [],
                    time: point.endTime,
                    isValid: i === parts.length - 1
                };
                // We don't want to display folders twice, but results might be duplicated since they could have been executed at a different time.
                if (i !== parts.length - 1) {
                    // This is not a file but a folder, push it to the intermediary.
                    if (!curr.hasOwnProperty(part)) {
                        curr[part] = {};
                        currIndex[part] = currFinal.children.length;
                        currFinal.children.push(x);
                        currFinal = x;
                    }
                    else {
                        currFinal = currFinal.children[currIndex[part]];
                    }
                    currIndex = currIndex[part];
                    curr = curr[part];
                }
                else {
                    currFinal.children.push(x);
                }
            }
            j++;
        });
        function NodeCreator(item, level) {
            var time = item.time ? " (" + getTimeAgo(new Date(item.time)) + ")" : "";
            var style = { paddingLeft: level * 16 };
            var img = "/images/file_type_".concat(item.label.split(".").at(-1), ".svg");
            var icon = Snowblind.make("img", { class: "file-icon", src: img });
            var folder_image = Snowblind.make("img", { class: "file-icon", src: "/images/folder_type_".concat(item.label, ".svg"), label: "", onerror: "this.style.display='none'" });
            var isNew = (item.isValid && (item.time > Date.now() - 60000));
            return (Snowblind.make(Snowblind.Fragment, null, item.isValid ?
                Snowblind.make("a", { style: style, onclick: function () { return setOffset(item.id); }, class: (item.id == offset ? "selected center" : "center") + (isNew ? " new" : "") },
                    icon,
                    item.label,
                    time) :
                Snowblind.make("p", { style: style },
                    folder_image,
                    item.label)));
        }
        var searchFile = function () {
            var start = inputRef.current.selectionStart;
            var end = inputRef.current.selectionEnd;
            var value = inputRef.current.value;
            setFilter(value);
            inputRef.current.value = filter;
            inputRef.current.setSelectionRange(start, end);
            inputRef.current.focus();
        };
        return (Snowblind.make(Snowblind.Fragment, null,
            Snowblind.make("div", { class: "sidebar center" },
                Snowblind.make("div", { class: "row gap-md" },
                    Snowblind.make("button", { onclick: removeAll }, "Remove All"),
                    Snowblind.make("button", { onclick: runAll }, "Run All")),
                Snowblind.make("input", { type: "text", placeholder: "Search for a file...", oninput: searchFile, ref: inputRef }),
                Snowblind.make(Tree, { data: tree[0].children, creator: NodeCreator })),
            Snowblind.make("div", { class: "main" },
                Snowblind.make(ItemDetails, { data: data, offset: offset }))));
    };
}
Snowblind.render(document.body, Snowblind.make(App, null));
//# sourceMappingURL=content.js.map