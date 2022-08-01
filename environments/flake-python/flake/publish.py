from .shared import output
import json
from .time import getTime

def publish():
	output["endTime"] = getTime()
	print(json.dumps(output))