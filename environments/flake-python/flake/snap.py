from watchpoints import watch as snap, watch_element
from .shared import output, scope
from .time import getTime
import copy

def registerVariableChange(frame: watch_element.WatchElement, elem, info):
	line = info[2]
	value = elem.obj
	name = elem.localvar
	scope[name] = value
	output["snapshots"].append({
		"time": getTime(),
		"event": {
			"type": "reassign",
			"line": line - 1,
			"name": name,
			"value": value
		},
		"context": {},
		"scope": copy.deepcopy(scope)
	})

snap.config(custom_printer=lambda x: x, callback=registerVariableChange)