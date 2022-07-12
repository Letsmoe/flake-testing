import ast
import astor
import argparse

parser = argparse.ArgumentParser(description="Parse Python code and return a rewritten form made for execution with flake-py")
parser.add_argument("input", type=str, help="A Python string to rewrite.")
args = parser.parse_args()

suite = ast.parse(args.input, mode = "exec")

# The index we're currently at.
index = 0

def getLocation(node: ast.Assert):
	line = 0
	end_lineno = 0
	col_offset = 0
	end_col_offset = 0
	if hasattr(node, "lineno"):
		line = node.lineno
	if hasattr(node, "end_lineno"):
		end_lineno = node.end_lineno
	if hasattr(node, "col_offset"):
		col_offset = node.col_offset
	if hasattr(node, "end_col_offset"):
		end_col_offset = node.end_col_offset
	return [line, end_lineno, col_offset, end_col_offset]

# Assign each node a parent
for node in ast.walk(suite):
	i = 0
	for child in ast.iter_child_nodes(node):
		child.parent = node
		child.index = i
		i += 1

def call(name, args):
	return ast.Call(func=ast.Name(ctx="Load", id=name), args=args, keywords=[])

def expr(name, args):
	return ast.Expr(value=call(name, args))

class RewriteAssertions(ast.NodeTransformer):
	def visit_Assert(self, node):
		global index
		# Save the test that shall be executed.
		test = node.test
		[line, end_line, start, end] = getLocation(node)
		content = astor.to_source(test)
		index += 1
		return expr("_make_assertion", [ast.Num(index), ast.Num(line - 1), ast.Num(start), ast.Num(end), ast.Str(""), ast.Str(content.strip()), test])
		

	def visit_Assign(self, node: ast.Assign):
		[line, end_line, start, end] = getLocation(node)
		value = node.value
		names = []
		target = node.targets[0]
		if isinstance(target, ast.Name):
			# Single assignment
			names.append(ast.Str(target.id))
		else:
			# Multi assignment
			for n in target.elts:
				names.append(ast.Str(n.id))
		# Rewrite the target so that it points to a callback
		node.value = call("_register_variable", [ast.List(elts=names, ctx="Load"), value, ast.Num(line - 1), ast.Num(start), ast.Num(end)])
		return node

	def visit_Import(self, node):
		[line, end_line, start, end] = getLocation(node)
		imports = node.names
		specifiers = []
		source = ""

		for imp in imports:
			specifiers.append({
				"name": imp.name,
				"local": imp.asname,
				"default": False
			})

		return expr("_import_module", [ast.Constant(specifiers), ast.Str(source), ast.Num(line - 1), ast.Num(start), ast.Num(end)])

	def visit_ImportFrom(self, node: ast.ImportFrom):
		[line, end_line, start, end] = getLocation(node)
		imports = node.names
		specifiers = []
		source = node.module

		for imp in imports:
			specifiers.append({
				"name": imp.name,
				"local": imp.asname,
				"default": False
			})

		return expr("_import_module", [ast.Constant(specifiers), ast.Str(source), ast.Num(line), ast.Num(start), ast.Num(end)])

# Publish the count of awaited assertions
rewritten = RewriteAssertions().visit(suite)
suite.body.insert(0, call("_set_await_assertion_count", [ast.Num(index)]))

print(astor.to_source(suite))