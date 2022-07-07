import { Snowblind, applyState } from "@snowblind/core";
function App() {
    var _a = applyState([]), data = _a[0], setData = _a[1];
    var _b = applyState(0), offset = _b[0], setOffsetState = _b[1];
    var ws = new WebSocket("ws://localhost:8088");
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
        if (e.key == "e") {
            setOffset(offset + 1);
        }
        else if (e.key == "q") {
            setOffset(offset - 1);
        }
    });
    return function () { return (Snowblind.make(Snowblind.Fragment, null,
        Snowblind.make("div", { class: "sidebar" }, data.map(function (x, i) {
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
        if (["1", "2", "3"].indexOf(e.key) > -1) {
            changeSection(parseInt(e.key) - 1);
        }
    });
    return function () {
        if (item) {
            var date = new Date(item.startTime);
            return (Snowblind.make("div", null,
                Snowblind.make("h3", null, item.inputFile),
                Snowblind.make("span", null,
                    offset + 1,
                    " of ",
                    props.data.length),
                Snowblind.make("span", null,
                    formatDate(date),
                    " - ",
                    getTimeAgo(date),
                    " ago"),
                Snowblind.make("div", { class: "row gap-md" },
                    Snowblind.make("button", { onclick: function () { return changeSection(0); } }, "General"),
                    Snowblind.make("button", { onclick: function () { return changeSection(1); } }, "Imports"),
                    Snowblind.make("button", { onclick: function () { return changeSection(2); } }, "Snapshots")),
                Snowblind.make(Section, { sectionIndex: section, data: item })));
        }
        else {
            return Snowblind.make("h2", null, "Waiting for data...");
        }
    };
}
function Section(props) {
    return function () {
        var item = props.data;
        if (props.sectionIndex == 0) {
            return Snowblind.make(Snowblind.Fragment, null, item.result.assertions.map(function (assertion, i) {
                return Snowblind.make("div", { class: "result" },
                    Snowblind.make("p", null,
                        "Content: ",
                        Snowblind.make("code", null, assertion.content)),
                    Snowblind.make("p", null,
                        "Description: ",
                        assertion.description),
                    Snowblind.make("p", null,
                        "Line: ",
                        assertion.line),
                    Snowblind.make("p", null,
                        "Status: ",
                        assertion.result === true ? Snowblind.make("span", { class: "success" }, "Success") : Snowblind.make("span", { class: "failure" }, "Failure")));
            }));
        }
        else if (props.sectionIndex == 1) {
            return Snowblind.make(Snowblind.Fragment, null,
                item.imports.map(function (value, i) {
                    return Snowblind.make(Snowblind.Fragment, null,
                        Snowblind.make("h3", null,
                            value.source,
                            " - Line ",
                            value.line),
                        value.specifiers.map(function (x) {
                            return Snowblind.make("div", { class: "indent row gap-lg center" },
                                Snowblind.make("b", null, x.name),
                                x.default ? Snowblind.make("span", { class: "info" }, "Default Import") : "");
                        }));
                }),
                item.imports.length === 0 ? Snowblind.make("h2", null, "There are no imports here.") : "");
        }
        else if (props.sectionIndex == 2) {
            return Snowblind.make(Snowblind.Fragment, null, item.snapshots.map(function (snapshot, i) {
                return Snowblind.make("div", { class: "snapshot" },
                    Snowblind.make("pre", null,
                        i + 1,
                        ". ",
                        Snowblind.make("code", null,
                            snapshot.event.type,
                            " ",
                            snapshot.event.name,
                            " = ",
                            snapshot.event.value)));
            }));
        }
        return Snowblind.make(Snowblind.Fragment, null);
    };
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
    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
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