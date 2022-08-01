from .time import getTime

callbacks = {
	"beforeEach": [],
	"afterEach": [],
}

comments = {
	"__main": ""
}

output = {
	"inputFile": "",
	"status": True,
	"result": {
		"groups": {},
		"assertions": []
	},
	"imports": [],
	"snapshots": [],
	"startTime": getTime()
}

scope = {}