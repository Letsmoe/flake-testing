import { ResultPipe } from "@flake-testing/core";
import { ResultPrinter } from "@flake-testing/core";
const TEST_FILE = process.cwd() + "/test/output.test.js";
const output = {
    inputFile: process.cwd() + "/test/main.test.js",
    testFile: TEST_FILE,
    identifier: "test",
    status: true,
    result: {
        groups: {},
        assertions: []
    },
    imports: [],
    snapshots: [],
    startTime: 0,
    endTime: 0
};
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
            value: value
        },
        scope: currentScope.getAll()
    });
    return value;
}
function receiveAssertion({ name, line, from, to, description, content, result }) {
    output.result.assertions.push({
        line,
        name,
        from: from,
        to: to,
        description: description.join(" "),
        content,
        // Check if the result is truthy
        result: !(!result)
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
function receiveModuleImport(importStatement) {
    output.imports.push(importStatement);
}
function getResults() {
    return new Promise((resolve, reject) => {
        let start = Date.now();
        import(TEST_FILE).then(module => {
            // The test function is inside the modules default export
            // Execute the modules default export function.
            let count = 0;
            module.default(({ line, from, to, content, description, name, result }) => {
                var _a;
                receiveAssertion({ line, from, to, content, description, name, result });
                count++;
                if (count === expectCount) {
                    (_a = actions["afterAll"]) === null || _a === void 0 ? void 0 : _a.forEach(action => action());
                    output.status = output.result.assertions.every((x) => x.result);
                    output.startTime = start;
                    output.endTime = Date.now();
                    resolve(output);
                }
            }, receiveNamedGroups, receiveCount, receiveModuleImport, actionRegisterReceiver, receiveVariableAssignment);
        });
    });
}
getResults().then(out => {
    let pipe = new ResultPipe();
    pipe.ready = () => {
        let printer = new ResultPrinter(pipe);
        let id = pipe.open();
        out.identifier = id;
        pipe.write(id, out);
        printer.print(id);
    };
});
