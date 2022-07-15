#!/bin/bash
function assert {
	# Check if the passed result is equal to 1 (true)
	local result=$(($(($1)) == 1))
	local line=${BASH_LINENO[0]}
}
