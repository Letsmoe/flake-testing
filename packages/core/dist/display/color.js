import supportsColor from "supports-color";
var Reset = "\x1b[0m";
var colorsTrueColor = {
    yellow: [255, 209, 102],
    green: [130, 158, 46],
    red: [224, 0, 90],
    blue: [33, 145, 251],
    lightblue: [155, 206, 253],
    black: [35, 32, 32],
    lightgreen: [218, 232, 176],
    underline: [4],
    bold: [1],
};
var colors256 = {
    yellow: "33",
    green: "32",
    red: "31",
    blue: "34",
    lightblue: "36",
    black: "30",
    lightgreen: "92",
    underline: "4",
    bold: "1",
    bg: {
        yellow: "43",
        green: "42",
        red: "41",
        blue: "44",
        lightblue: "46",
        black: "40",
        lightgreen: "102",
    }
};
var color = function (color) { return function (message, settings) {
    if (settings === void 0) { settings = { skipReset: false }; }
    return "\u001B[".concat(color, "m").concat(message).concat(settings.skipReset ? "" : Reset);
}; };
var handler = {};
handler.get = function (target, prop) {
    // Check if the console supports truecolor
    if (supportsColor.stdout) {
        // Check if the property is a color
        if (prop === "bg") {
            return new Proxy({
                rgb: function (_a) {
                    var r = _a[0], g = _a[1], b = _a[2];
                    return function (message, settings) {
                        if (settings === void 0) { settings = { skipReset: false }; }
                        return "\u001B[48;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(message).concat(settings.skipReset ? "" : Reset);
                    };
                }
            }, handler);
        }
        if (colorsTrueColor[prop]) {
            if (colorsTrueColor[prop].length === 3) {
                return target.rgb(colorsTrueColor[prop]);
            }
            else {
                return color(colorsTrueColor[prop][0]);
            }
        }
    }
    else {
        // Check if the property is a color
        if (colors256[prop]) {
            return colors256[prop];
        }
    }
};
var c = new Proxy({
    rgb: function (_a) {
        var r = _a[0], g = _a[1], b = _a[2];
        return function (message, settings) {
            if (settings === void 0) { settings = { skipReset: false }; }
            return "\u001B[38;2;".concat(r, ";").concat(g, ";").concat(b, "m").concat(message).concat(settings.skipReset ? "" : Reset);
        };
    }
}, handler);
export { c };
//# sourceMappingURL=color.js.map