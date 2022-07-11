import { Parser } from "acorn";
import escodegen from "escodegen";
import * as walk from "acorn-walk";
// A function that removes the leading and trailing asterisks, slashes and whitespace from a string.
function trimAsterisk(str) {
    return str.replace(/^[*\/\s]+|[*\/\s]+$/g, "");
}
export function RewriteJavaScriptFileContent(content) {
    // An array to store imports so they don't end up in the exported function.
    const imports = [];
    // An object that stores information about the names of groups that can be defined like this: "assert__main: awd" this corresponds to the group "main"
    const namedGroups = {};
    // A counter so we can give each test a unique number;
    var counter = 0;
    var everyDescription = [];
    // Collect all comments into an array
    let accumulateComments = [];
    let comments = [];
    const ast = Parser.parse(content, {
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
    // Walk through the AST tree
    walk.ancestor(ast, {
        CallExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "assert") {
            }
        },
        LabeledStatement(node) {
            // An assert maybe assigned to a group of tests so we can later on differentiate between them.
            let assignedGroup = null;
            // Get the node name.
            let name = node.label.name;
            // Try to get all comments that stood before the node.
            let tokenComments = [];
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
                            }
                            else if (command.startsWith("every")) {
                                // This tells us that the user wants to use this description for the next tests until we find a new description.
                                everyDescription.push(command.substring(6).trim());
                                continue;
                            }
                        }
                        if (result)
                            tokenComments.push(result);
                    }
                }
            }
            if (name.startsWith("assert") || name.startsWith("$")) {
                node.type = "ExpressionStatement";
                node.expression = RewriteLabeledStatementBody(node.body, everyDescription.concat(tokenComments));
                if (name.startsWith("assert_")) {
                    assignedGroup = name.substring(7);
                }
                else if (name.startsWith("$_")) {
                    assignedGroup = name.substring(2);
                }
                if (assignedGroup) {
                    if (!namedGroups[assignedGroup])
                        namedGroups[assignedGroup] = [];
                    namedGroups[assignedGroup].push(counter - 1);
                }
                delete node.label;
                delete node.body;
            }
            else if (["afterAll", "beforeAll", "snap"].indexOf(name) !== -1) {
                node.type = "ExpressionStatement";
                node.expression = CallExpression("_register_action", [
                    Literal(name),
                    node.body.expression,
                    Literal(getCurrentLine(node.start)),
                    Literal(node.start),
                    Literal(node.end)
                ]);
                delete node.label;
                delete node.body;
            }
        },
        ImportDeclaration(node) {
            // We don't want to include the import statements inside the default export function.
            node.type = "ExpressionStatement";
            node.expression = CallExpression("_import_module", [
                {
                    type: "ArrayExpression",
                    elements: node.specifiers.map((specifier) => {
                        let isDefault = specifier.type === "ImportDefaultSpecifier";
                        return {
                            type: "ObjectExpression",
                            properties: [
                                Property("name", Literal(isDefault
                                    ? specifier.local.name
                                    : specifier.imported.name)),
                                Property("local", Literal(specifier.local.name)),
                                Property("default", Literal(isDefault)),
                            ],
                        };
                    }),
                },
                Literal(node.source.value),
                Literal(node.start),
                Literal(node.end),
                Literal(getCurrentLine(node.start))
            ]);
            imports.push({
                source: node.source.value,
                specifiers: node.specifiers.map((specifier) => {
                    let isDefault = specifier.type === "ImportDefaultSpecifier";
                    return {
                        name: isDefault
                            ? specifier.local.name
                            : specifier.imported.name,
                        local: specifier.local.name,
                        default: isDefault,
                    };
                }),
                line: getCurrentLine(node.start),
                from: node.start,
                to: node.end
            });
            delete node.source;
            delete node.specifiers;
        },
        /**
         * We receive an assignment expression like this: `const x = 5`
         * We want to rewrite this to be something like this: `const x = _do_register_variable("x", 5, {line: __LINE__, from: __START__, to: __END__, type: "var"})`
         * @param node The node to rewrite
         */
        VariableDeclaration(node) {
            let declarations = node.declarations;
            for (const declaration of declarations) {
                /**
                 * The object looks like this:
                 * {
                 *	"type": "VariableDeclaration",
                 *	"declarations": [
                 *		{
                 *		"type": "VariableDeclarator",
                 *		"id": {
                 *			"type": "Identifier",
                 *			"name": "q"
                 *		},
                 *		"init": {
                 *			"type": "Literal",
                 *			"value": 5,
                 *			"raw": "5"
                 *		}
                 *		},
                 *		{
                 *		"type": "VariableDeclarator",
                 *		"id": {
                 *			"type": "Identifier",
                 *			"name": "b"
                 *		},
                 *		"init": {
                 *			"type": "Literal",
                 *			"value": 4,
                 *			"raw": "4"
                 *		}
                 *		}
                 *	],
                 *	"kind": "var"
                 *	}
                 *
                 * Which we want to rewrite to this:
                 * 	```
                 * 		var q = _do_register_variable("q", 5, {line: __LINE__, from: __START__, to: __END__, type: "var"}),
                 *			b = _do_register_variable("b", 4, {line: __LINE__, from: __START__, to: __END__, type: "var"});
                 *	```
                 */
                let id = declaration.id.name;
                let init = declaration.init;
                // Get the current line from how far we've already got character wise
                let line = getCurrentLine(node.start);
                let newInit = CallExpression("_do_register_variable", [
                    Literal(id),
                    init,
                    {
                        type: "ObjectExpression",
                        properties: [
                            Property("line", Literal(line)),
                            Property("from", Literal(node.start)),
                            Property("to", Literal(node.end)),
                            Property("type", Literal(node.kind)),
                        ],
                    },
                ]);
                declaration.init = newInit;
            }
        },
        ExpressionStatement(node) {
            // We only want to publish changes to variables ("AssignmentExpression")
            if (node.expression.type !== "AssignmentExpression") {
                return;
            }
            let left = node.expression.left;
            let leftName = left.name;
            // We now change the right hand side of the assignment to publish the changes to the listener (_do_register_variable)
            let newRight = CallExpression("_do_register_variable", [
                Literal(leftName),
                node.expression.right,
                {
                    type: "ObjectExpression",
                    properties: [
                        Property("line", Literal(getCurrentLine(node.start))),
                        Property("from", Literal(node.start)),
                        Property("to", Literal(node.end)),
                        Property("type", Literal("reassign")),
                    ],
                },
            ]);
            node.expression.right = newRight;
        },
    });
    function Property(name, value, method = false, computed = false, shorthand = false) {
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
    function CallExpression(name, args) {
        return {
            type: "CallExpression",
            callee: { type: "Identifier", name: name },
            arguments: args,
            optional: false,
        };
    }
    function Literal(value, raw) {
        return {
            type: "Literal",
            value: value,
            raw: raw || value.toString(),
        };
    }
    function getCurrentLine(start) {
        // Calculate the line number from the start of the node by looking at the characters in front of it and subtracting the length of each line until we reach the start of the node.
        return content.substring(0, start).split("\n").length - 1;
    }
    function RewriteLabeledStatementBody(body, comments) {
        let bodyAsString = escodegen.generate(body.expression);
        let lineNumber = getCurrentLine(body.start);
        let newBody = CallExpression("_make_assertion", [
            {
                type: "ObjectExpression",
                properties: [
                    Property("line", Literal(lineNumber)),
                    Property("from", Literal(body.start)),
                    Property("to", Literal(body.end)),
                    Property("name", Literal(counter)),
                    Property("description", {
                        type: "ArrayExpression",
                        elements: comments.map((x) => {
                            return Literal(x);
                        }),
                    }),
                    Property("content", Literal(bodyAsString)),
                    Property("result", body.expression)
                ]
            }
        ]);
        // Increment the counter so we don't generate the same name again.
        counter++;
        return newBody;
    }
    var output = "";
    imports.forEach((importStatement) => {
        importStatement.specifiers.forEach((specifier) => {
            if (specifier.default) {
                output += `import ${specifier.local} from "${importStatement.source}";\n`;
            }
            else {
                output += `import { ${specifier.name} as ${specifier.local} } from "${importStatement.source}";\n`;
            }
        });
    });
    output += "\n";
    output += `export default async function(_make_assertion = () => {}, _publish_named_groups = () => {}, _set_await_assertion_count = () => {}, _import_module = () => {}, _register_action = () => {}, _do_register_variable = (name, value) => {return value;}) {
	/* @action didPublishCount */
	(_set_await_assertion_count(${counter}));
	(_publish_named_groups(${JSON.stringify(namedGroups)}));
	${escodegen.generate(ast)}
	};`;
    return output;
}
