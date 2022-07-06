import supportsColor from "supports-color";
const Reset = "\x1b[0m"

interface ColorObject {
	yellow: (message: string) => string;
	red: (message: string) => string;
	green: (message: string) => string;
	blue: (message: string) => string;
	lightblue: (message: string) => string;
	black: (message: string) => string;
	lightgreen: (message: string) => string;
	underline: (message: string) => string;
	bold: (message: string) => string;
	bg: ColorObject;
	rgb: ([r,g,b]: number[]) => (message: string, settings: {skipReset: boolean}) => string;
	default: ([r,g,b]: number[]) => (message: string, settings: {skipReset: boolean}) => string;
}

const colorsTrueColor = {
	yellow: [255, 209, 102],
	green: [130, 158, 46],
	red: [224, 0, 90],
	blue: [33, 145, 251],
	lightblue: [155, 206, 253],
	black: [35, 32, 32],
	lightgreen: [218, 232, 176],
	underline: [4],
	bold: [1],
}

const colors256 = {
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
}

const color = (color: string) => (message: string, settings = {skipReset: false}) => `\x1b[${color}m${message}${settings.skipReset ? "" : Reset}`;

const handler: ProxyHandler<ColorObject> = {}
handler.get = (target: ColorObject, prop: string) => {
	// Check if the console supports truecolor
	if (supportsColor.stdout) {
		// Check if the property is a color
		if (prop === "bg") {
			return new Proxy({
				rgb: ([r,g,b]) => (message: string, settings = {skipReset: false}) => `\x1b[48;2;${r};${g};${b}m${message}${settings.skipReset ? "" : Reset}`
			} as ColorObject, handler)
		}

		if (colorsTrueColor[prop]) {
			if (colorsTrueColor[prop].length === 3) {
				return target.rgb(colorsTrueColor[prop]);
			} else {
				return color(colorsTrueColor[prop][0]);
			}
		}
	} else {
		// Check if the property is a color
		if (colors256[prop]) {
			return colors256[prop];
		}
	}
}

const c = new Proxy({
	rgb: ([r,g,b]) => (message: string, settings = {skipReset: false}) => `\x1b[38;2;${r};${g};${b}m${message}${settings.skipReset ? "" : Reset}`
} as unknown as ColorObject, handler)

export { c }