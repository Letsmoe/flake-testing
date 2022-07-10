import { Snowblind, applyState, applyRef } from "@snowblind/core";
var ws = new WebSocket("ws://localhost:8088");
function App() {
    var _a = applyState([]), data = _a[0], setData = _a[1];
    var _b = applyState(0), offset = _b[0], setOffsetState = _b[1];
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
        setData(json.data);
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
    return function () { return (Snowblind.make(Snowblind.Fragment, null,
        Snowblind.make("div", { class: "sidebar center" },
            Snowblind.make("div", { class: "row gap-md" },
                Snowblind.make("button", { onclick: removeAll }, "Remove All"),
                Snowblind.make("button", { onclick: runAll }, "Run All")),
            data.map(function (x, i) {
                var className = "item-select" + (i == offset ? " selected" : "");
                return Snowblind.make("div", { class: className, onclick: function () { return setOffset(i); } },
                    Snowblind.make("a", null, x.inputFile.split("/").at(-1)),
                    Snowblind.make("span", null,
                        getTimeAgo(new Date(x.startTime)),
                        " ago"),
                    (x.startTime > Date.now() - 60000) ? Snowblind.make("span", { class: "info" }, "New") : "");
            })),
        Snowblind.make("div", { class: "main" },
            Snowblind.make(ItemDetails, { data: data, offset: offset })))); };
}
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
function openFile(fileName, line, column) {
    var data = {
        file: fileName
    };
    if (line)
        data["line"] = line;
    if (column)
        data["column"] = column;
    ws.send(JSON.stringify({
        type: "POST",
        action: "OPEN_FILE",
        data: data
    }));
}
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
                        Snowblind.make("code", null, JSON.stringify((_a = item.snapshots.at(-1)) === null || _a === void 0 ? void 0 : _a.scope, null, 2))))));
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
            return Snowblind.make(Snowblind.Fragment, null, item.snapshots.map(function (snapshot, i) {
                return Snowblind.make("div", { class: "snapshot" },
                    Snowblind.make("code", { style: { marginBottom: 10 } },
                        snapshot.event.name,
                        " = ",
                        variableMarkup(snapshot.event.value, 0, true)),
                    markupCode(snapshot.context, snapshot.event.line));
            }));
        }
        return Snowblind.make(Snowblind.Fragment, null);
    };
}
var x = [
    "nice",
    4,
    [
        "arrays",
        "in",
        1,
        {
            "object": true
        }
    ]
];
function variableMarkup(value, indent, inline) {
    if (indent === void 0) { indent = 0; }
    if (inline === void 0) { inline = false; }
    var style = {
        marginLeft: indent * 10
    };
    if (inline)
        style["display"] = "inline";
    if (typeof value === "string") {
        return Snowblind.make("span", { class: "code string" },
            "\"",
            value,
            "\"");
    }
    else if (typeof value === "number") {
        return Snowblind.make("span", { class: "code number" }, value);
    }
    else if (typeof value === "object" && Array.isArray(value)) {
        return Snowblind.make("div", { style: style, class: "code array" },
            Snowblind.make("span", { class: "code open-bracket" }),
            value.map(function (x) {
                return variableMarkup(x, indent + 1);
            }),
            Snowblind.make("span", { class: "code closing-bracket" }));
    }
    else if (typeof value === "object") {
        return Snowblind.make("div", { style: style, class: "code object" },
            Snowblind.make("span", { class: "code open-brace" }),
            Object.entries(value).map(function (_a) {
                var key = _a[0], val = _a[1];
                return Snowblind.make("code", { class: "line" },
                    Snowblind.make("span", { class: "code string key" },
                        "\"",
                        key,
                        "\""),
                    variableMarkup(val, indent + 1));
            }),
            Snowblind.make("span", { class: "code closing-brace" }));
    }
    else {
        return Snowblind.make("span", { class: "code boolean" }, value);
    }
}
function markupCode(code, markupLine) {
    // We receive an object with line numbers as keys and contents as values.
    return (Snowblind.make("pre", null, Object.entries(code).map(function (_a) {
        var lineNumber = _a[0], lineContent = _a[1];
        if (parseInt(lineNumber) === markupLine) {
            return Snowblind.make("code", { class: "highlight-line" },
                Snowblind.make("span", { class: "line-number" }, lineNumber),
                lineContent);
        }
        return Snowblind.make("code", null,
            Snowblind.make("span", { class: "line-number" }, lineNumber),
            lineContent);
    })));
}
/**
 * A function to return how far another date is away from the current date.
 * @date 7/6/2022 - 12:52:04 PM
 *
 * @param {Date} date
 */
function getTimeAgo(date) {
    // @ts-ignore
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    var mod = function (name) {
        var floor = Math.floor(interval);
        return floor + " " + name + (floor > 1 ? "s" : "");
    };
    interval = seconds / 31536000;
    if (interval > 1) {
        return mod("year");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return mod("month");
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return mod("day");
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return mod("hour");
    }
    interval = seconds / 60;
    if (interval > 1) {
        return mod("minute");
    }
    interval = seconds;
    return mod("second");
}
function formatDate(date) {
    var pad = function (x) { return x.toString().trim().padStart(2, "0"); };
    var months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return "".concat(months[date.getMonth()], " ").concat(pad(date.getDate()), " ").concat(date.getFullYear(), " ").concat(pad(date.getHours()), ":").concat(pad(date.getMinutes()), ":").concat(pad(date.getSeconds()));
}
Snowblind.render(document.body, Snowblind.make(App, null));
//# sourceMappingURL=content.js.map