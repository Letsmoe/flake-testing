from .shared import callbacks, output, comments
from inspect import getframeinfo, stack

index = 0

def _(validate: bool, description: str = "", group: str = ""):
	global index
	info = getframeinfo(stack()[1][0])
	line = info.lineno
	context = info.code_context
	output["result"]["assertions"].append({
		"line": line - 1,
		"description": description or (comments.get(group) if group else "") or comments["__main"] or "",
		"context": {},
		"name": index,
		"result": True if validate else False,
		"content": context[0].strip()
	})
	for listener in callbacks["afterEach"]:
		listener()
	for listener in callbacks["beforeEach"]:
		listener()
	index += 1