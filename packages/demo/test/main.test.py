from flake import afterEach, beforeEach, snap, _

def main():
	return 42


result = main()
snap(result)

def increment():
	global result
	result += 1

afterEach(increment)

for i in range(5):
	_(result == (42 + i))