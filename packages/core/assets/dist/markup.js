import { applyRef, Snowblind } from "@snowblind/core";
function variableMarkup(value, indent, inline) {
    if (indent === void 0) { indent = 0; }
    if (inline === void 0) { inline = false; }
    var style = {
        marginLeft: indent * 10
    };
    if (inline)
        style["display"] = "inline";
    var objectRef = applyRef();
    var fold = Snowblind.make("span", { class: "code fold", onclick: function () {
            objectRef.current.classList.toggle("folded");
        } });
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
        return Snowblind.make("div", { style: style, class: "code array", ref: objectRef },
            fold,
            Snowblind.make("span", { class: "code open-bracket" }),
            value.map(function (x) {
                return variableMarkup(x, indent + 1);
            }),
            Snowblind.make("span", { class: "code closing-bracket" }));
    }
    else if (typeof value === "object") {
        return Snowblind.make("div", { style: style, class: "code object", ref: objectRef },
            fold,
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
export { markupCode, variableMarkup };
//# sourceMappingURL=markup.js.map