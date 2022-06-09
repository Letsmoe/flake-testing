import acorn, { Parser } from "acorn";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import escodegen from "escodegen";
import * as walk from "acorn-walk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const code = fs.readFileSync(
	path.join(__dirname, "../test/test.test.js"),
	"utf8"
);
let accumulateComments = [];
let comments = [];

const ast = Parser.parse(code, {
	ecmaVersion: 2022,
	sourceType: "module",
	onToken: function (token) {
		comments[token.start] = accumulateComments;
		accumulateComments = [];
	},
	onComment: (_, comment) => {
		accumulateComments.push(comment);
	},
});

// A function that removes the leading and trailing asterisks, slashes and whitespace from a string.
function trimAsterisk(str: string) {
	return str.replace(/^[*\/\s]+|[*\/\s]+$/g, "");
}

// An array to store imports so they don't end up in the exported function.
type ImportObject = { source: string; specifiers: any[] };
const imports: ImportObject[] = [];

// An object that stores information about the names of groups that can be defined like this: "assert__main: awd" this corresponds to the group "main"
const namedGroups = {};
// A counter so we can give each test a unique number;
var counter = 0;
var everyDescription = [];

walk.ancestor(ast, {
	LabeledStatement(
		node: acorn.Node & {
			label: { name: string };
			body: any;
			expression: any;
		}
	) {
		// An assert maybe assigned to a group of tests so we can later on differentiate between them.
		let assignedGroup = null;
		// Get the node name.
		let name = node.label.name;
		// Try to get all comments that stood before the node.
		let tokenComments: string[] = [];
		if (comments[node.start].length > 0) {
			everyDescription = [];
			for (const comment of comments[node.start]) {
				for (const line of comment.split("\n")) {
					let result = trimAsterisk(line);
					if (result.startsWith("@")) {
						// This might be a command to be executed on parsing, maybe a group name.
						let command = result.substring(1);
						if (command.startsWith("group")) {
							// This is a group name, they're not allowed to contain whitespace, remove that and trim it.
							let groupName = command
								.substring(5)
								.trim()
								.replace(/\s/g, "_");
							if (groupName.length > 0) {
								// Don't use empty group names.
								assignedGroup = groupName;
								// We don't want to use this as a comment, so continue
								continue;
							}
						} else if (command.startsWith("every")) {
							// This tells us that the user wants to use this description for the next tests until we find a new description.
							everyDescription.push(command.substring(6).trim());
							continue;
						}
					}

					if (result) tokenComments.push(result);
				}
			}
		}
		if (name.startsWith("assert") || name === "$") {
			node.type = "ExpressionStatement";
			node.expression = RewriteLabeledStatementBody(
				node.body,
				everyDescription.concat(tokenComments)
			);

			if (name.startsWith("assert__")) {
				assignedGroup = name.substring(8);
			}

			if (assignedGroup) {
				if (!namedGroups[assignedGroup])
					namedGroups[assignedGroup] = [];
				namedGroups[assignedGroup].push(counter - 1);
			}

			delete node.label;
			delete node.body;
		} else if (["afterAll", "beforeAll"].indexOf(name) !== -1) {
			node.type = "ExpressionStatement";
			node.expression = CallExpression("_register_action", [
				Literal(name),
				node.body.expression
			]);
			delete node.label;
			delete node.body;
		}
	},
	ImportDeclaration(node: any) {
		// We don't want to include the import statements inside the default export function.
		node.type = "ExpressionStatement";
		node.expression = CallExpression("_import_module", [
			{
				type: "ArrayExpression",
				elements: node.specifiers.map((specifier: any) => {
					let isDefault = specifier.type === "ImportDefaultSpecifier"
					return {
						type: "ObjectExpression",
						properties: [
							Property("name", Literal(isDefault ? specifier.local.name : specifier.imported.name)),
							Property("local", Literal(specifier.local.name)),
							Property("default", Literal(isDefault))
						],
					};
				}),
			},
			Literal(node.source.value),
		]);
		imports.push({
			source: node.source.value,
			specifiers: node.specifiers.map((specifier: any) => {
				let isDefault = specifier.type === "ImportDefaultSpecifier"
				return {
					name: isDefault ? specifier.local.name : specifier.imported.name,
					local: specifier.local.name,
					default: isDefault
				};
			}),
		});
		delete node.source;
		delete node.specifiers;
	},
});

function Property(
	name: string,
	value: any,
	method: boolean = false,
	computed: boolean = false,
	shorthand: boolean = false
) {
	return {
		type: "Property",
		method,
		computed,
		shorthand,
		key: {
			type: "Identifier",
			name,
		},
		value,
	};
}

function CallExpression(name: string, args: {}[]) {
	return {
		type: "CallExpression",
		callee: { type: "Identifier", name: name },
		arguments: args,
		optional: false,
	};
}

function Literal(value: any, raw?: string) {
	return {
		type: "Literal",
		value: value,
		raw: raw || value.toString(),
	};
}

function RewriteLabeledStatementBody(body: any, comments: string[]) {
	let bodyAsString = escodegen.generate(body.expression);
	// Calculate the line number from the start of the node by looking at the characters in front of it and subtracting the length of each line until we reach the start of the node.
	let lineNumber = 1;
	let lineLength = 0;
	for (let line of code.split("\n")) {
		lineLength += line.length + 1;
		if (body.start - lineLength > 0) {
			lineNumber++;
		} else {
			break;
		}
	}

	let newBody = CallExpression("_make_assertion", [
		Literal(counter),
		Literal(lineNumber),
		{
			type: "ArrayExpression",
			elements: comments.map((x) => {
				return Literal(x);
			}),
		},
		Literal(bodyAsString),
		body.expression,
	]);
	// Increment the counter so we don't generate the same name again.
	counter++;

	return newBody;
}




var output = "";

imports.forEach(importStatement => {
	importStatement.specifiers.forEach(specifier => {
		if (specifier.default) {
			output += `import ${specifier.local} from "${importStatement.source}";\n`;
		} else {
			output += `import { ${specifier.name} as ${specifier.local} } from "${importStatement.source}";\n`;
		}
	})
})

output += '\n';
output += `export default function(_make_assertion = () => {}, _publish_named_groups = () => {}, _set_await_assertion_count = () => {}, _import_module = () => {}, _register_action = () => {}) {
(_set_await_assertion_count(${counter}));
${escodegen.generate(ast)}
(_publish_named_groups(${JSON.stringify(namedGroups)}));
};`


console.log(output);
