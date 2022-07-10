#!/usr/bin/env node
import { Flake, allowExecution } from "@flake-universal/core";
import { RewriteJavaScriptFileContent } from "./rewriteFiles.js";
class Scope {
    constructor(initial = {}) {
        this.properties = initial;
    }
    set(name, value) {
        this.properties[name] = value;
    }
    get(name) {
        return this.properties[name];
    }
    getAll() {
        return Object.assign({}, this.properties);
    }
}
if (allowExecution) {
    (async () => {
        // Connect to the main flake instance
        // Supply the connection with a config.
        const config = await Flake.getConfig();
        // This will use a default config if no other was found.
        const conn = Flake.connect(config, {
            displayOnSubmit: false,
            defaultFileExtension: "js",
            enableServer: true
        });
        // Subscribe to a file change event
        conn.subscribe(/.*\.(?:test|spec)\.(?:tsx|jsx|ts|js)/, (submit, hash, content) => {
            // Rewrite the test file and return it back to the flake connection
            let rewritten = RewriteJavaScriptFileContent(content);
            // Submit the result with a provided hash that uniquely identifies the file.
            let resultFilePath = submit(rewritten);
            const output = {
                inputFile: "",
                testFile: resultFilePath,
                identifier: hash,
                status: true,
                result: {
                    groups: {},
                    assertions: [],
                },
                imports: [],
                snapshots: [],
                startTime: 0,
                endTime: 0,
            };
            const currentScope = new Scope();
            function receiveVariableAssignment(name, value, { line, from, to, type }) {
                currentScope.set(name, value);
                output.snapshots.push({
                    time: Date.now(),
                    event: {
                        type: type,
                        line,
                        from,
                        to,
                        name,
                        value: value,
                    },
                    scope: currentScope.getAll(),
                    context: {}
                });
                return value;
            }
            function receiveAssertion({ name, line, from, to, description, content, result, }) {
                output.result.assertions.push({
                    line,
                    name,
                    from: from,
                    to: to,
                    description: description.join(" "),
                    content,
                    // Check if the result is truthy or - if strictCompare is set to true - if it is "true".
                    result: config.strictCompare ? result === true : !!result,
                    context: {}
                });
            }
            function receiveNamedGroups(groups) {
                output.result.groups = groups;
            }
            const actions = {};
            function actionRegisterReceiver(name, callback) {
                if (!actions[name])
                    actions[name] = [];
                actions[name].push(callback);
            }
            function receiveCount(count) {
                expectCount = count;
            }
            var expectCount = 0;
            function receiveModuleImport(specifiers, source, from, to, line) {
                output.imports.push({
                    line,
                    from,
                    to,
                    source,
                    specifiers
                });
            }
            function getResults(file, callback) {
                let start = Date.now();
                import(file).then((module) => {
                    // The test function is inside the modules default export
                    // Execute the modules default export function.
                    var count = 0;
                    module.default(({ line, from, to, content, description, name, result, }) => {
                        receiveAssertion({
                            line,
                            from,
                            to,
                            content,
                            description,
                            name,
                            result,
                        });
                        count++;
                        if (count === expectCount) {
                            actions["afterAll"]?.forEach((action) => action());
                            // Check if all results are true, meaning they completed successfully.
                            output.status = output.result.assertions.every((x) => x.result);
                            output.startTime = start;
                            output.endTime = Date.now();
                            callback(output);
                        }
                    }, receiveNamedGroups, receiveCount, receiveModuleImport, actionRegisterReceiver, receiveVariableAssignment);
                });
            }
            // Run all tests in a prepared manner
            conn.prepare(hash, (err, submit) => {
                if (err) {
                    throw err;
                }
                // Run the tests and submit them to the connection.
                getResults(resultFilePath, (out) => {
                    // Submit the result connected to the hash, this will delete all leftovers of the test.
                    submit(out);
                    // Display all results.
                    Flake.display(conn);
                });
            });
        });
    })();
}
