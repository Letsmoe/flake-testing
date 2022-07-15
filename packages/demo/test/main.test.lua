require "flake/lua"

function main()
	return 42
end

result = main()

afterAll(function () result = result + 1 end)

for i = 0, i < 5, i = i + 1 do
	assert(result == (42 + i))
end