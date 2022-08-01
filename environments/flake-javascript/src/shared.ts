import { OutputObject } from "@flake-universal/core";
import { getTime } from "./time.js";

export const output: OutputObject = {
	"inputFile": "",
	"status": true,
	"result": {
		"groups": {},
		"assertions": []
	},
	"imports": [],
	"snapshots": [],
	"startTime": getTime(),
	"endTime": 0
}

export const callbacks = {
	"beforeEach": [],
	"afterEach": [],
}

export const comments = {
	"__main": ""
}

export const scope = {}