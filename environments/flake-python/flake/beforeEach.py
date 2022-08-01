from .shared import callbacks


def beforeEach(func):
	func()
	callbacks["beforeEach"].append(func)