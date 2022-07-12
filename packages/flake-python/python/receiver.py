def __InitTestEnvironment():
	import time
	import copy
	import json

	def current_millis():
		return time.time_ns() // 1_000_000

	start = current_millis()
	# The number of tests we expect to be performed
	expect = 0
	# The index of the current test
	index = 0
	output = {
		"inputFile": "",
		"testFile": "",
		"identifier": "",
		"status": True,
		"result": {
			"groups": {},
			"assertions": [],
		},
		"imports": [],
		"snapshots": [],
		"startTime": start,
		"endTime": 0,
	}

	class Scope(object):
		def __init__(self,):
			self.properties = {}

		def set(self, name, value):
			self.properties[name] = value
		
		def get(self, name):
			return self.properties[name]

		def getAll(self):
			return copy.deepcopy(self.properties)

	scope = Scope()

	def _publish_named_groups(groups):
		output["result"]["groups"] = groups;

	def _set_await_assertion_count(x: int):
		nonlocal expect
		expect = x


	def _import_module(specifiers, source: str, start: int, end: int, line: int) -> None:
		for specifier in specifiers:
			name = specifier["local"] or specifier["name"]
			if source:
				__import__(source, level=0, globals=globals())
			else:
				__import__(specifier["name"], globals=globals())
		output["imports"].append({
			"line": line,
			"from": start,
			"to": end,
			"source": "source",
			"specifiers": specifiers
		})


	def ActionReceiver(name: str, callback, line: int, start: int, end: int) -> None:
		pass


	def _make_assertion(name: str, line: int, start: int, end: int, description: str, content: str, result: any):
		nonlocal index
		output["result"]["assertions"].append({
			"line": line,
			"name": name,
			"from": start,
			"to": end,
			"description": description,
			"content": content,
			"result": not not result,
			"context": {}
		})
		index += 1
		if index == expect:
			output["endTime"] = current_millis()
			output["status"] = all(output["result"]["assertions"])
			print(json.dumps(output))


	def _register_variable(names: list, value: any, line: int, start: int, end: int):
		for i, name in enumerate(names):
			scope.set(name, value[i] if isinstance(value, list) else value);
		output["snapshots"].append({
			"time": current_millis(),
			"event": {
				"type": "assign",
				"line": line,
				"from": start,
				"to": end,
				"name": name,
				"value": value,
			},
			"scope": scope.getAll(),
			"context": {}
		})
		return value

	return [_make_assertion, _register_variable, _import_module, _set_await_assertion_count, _publish_named_groups]

[_make_assertion, _register_variable, _import_module, _set_await_assertion_count, _publish_named_groups] = __InitTestEnvironment()
del __InitTestEnvironment