
export default function(_make_assertion = () => {}, _publish_named_groups = () => {}, _set_await_assertion_count = () => {}, _import_module = () => {}, _register_action = () => {}, _do_register_variable = (name, value) => {return value;}) {
/* @action didPublishCount */
(_set_await_assertion_count(2));
function main() {
    return 42;
}
_register_action('afterAll', () => {
    console.log(result);
});
let result = _do_register_variable('result', main(), {
    line: 9,
    from: 75,
    to: 94,
    type: 'let'
});
const x = _do_register_variable('x', 5, {
    line: 10,
    from: 95,
    to: 107,
    type: 'const'
});
var y = _do_register_variable('y', { nice: true }, {
    line: 12,
    from: 108,
    to: 131,
    type: 'var'
});
_make_assertion({
    line: 17,
    from: 258,
    to: 284,
    name: 0,
    description: ['This is a test for the "main" function above, it should return true and therefore pass the test.'],
    content: 'typeof result === \'string\'',
    result: typeof result === 'string'
});
_make_assertion({
    line: 20,
    from: 289,
    to: 301,
    name: 1,
    description: ['This is a test for the "main" function above, it should return true and therefore pass the test.'],
    content: 'result == 42',
    result: result == 42
});
/* @action didPublishGroups */
(_publish_named_groups({"main":[0]}));
};
