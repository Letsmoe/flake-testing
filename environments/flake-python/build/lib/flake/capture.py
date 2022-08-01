from inspect import getframeinfo, stack
from .shared import scope, output
from .time import getTime
import copy

def capture(value):
	info = getframeinfo(stack()[1][0])
	line = info.lineno
	output["snapshots"].append({
		"time": getTime(),
		"event": {
			"type": "reassign",
			"line": line - 1,
			"name": "capture",
			"value": value
		},
		"context": {},
		"scope": copy.deepcopy(scope)
	})