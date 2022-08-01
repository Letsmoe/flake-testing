from .shared import callbacks


def afterEach(func):
	callbacks["afterEach"].append(func)