def main():
	return 42

# @every Something is wrong.
result = main()
assert result == 42
assert result > 43
assert isinstance(result, int)
assert isinstance(result, str)