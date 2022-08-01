from flake import snap, _
# Hello

x = 5
snap(x)
x = 7

def test_sum():
	_(sum([1, 2, 3]) == 6, "Should be 6")

def test_sum_tuple():
    _(sum([1, 2, 2]) == 6, "Should be 6")

if __name__ == "__main__":
    test_sum()
    test_sum_tuple()