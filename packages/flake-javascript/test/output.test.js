
export default function(_make_assertion = () => {}, _publish_named_groups = () => {}, _set_await_assertion_count = () => {}, _import_module = () => {}, _register_action = () => {}, _do_register_variable = (name, value) => {return value;}) {
/* @action didPublishCount */
(_set_await_assertion_count(3));
function main() {
    return 42;
}
let result = _do_register_variable('result', main(), {
    line: 5,
    from: 33,
    to: 52,
    type: 'let'
});
_make_assertion({
    line: 8,
    from: 131,
    to: 144,
    name: 0,
    description: ['We\'re testing the "main" function which returns 42 when called.'],
    content: 'result === 42',
    result: result === 42
});
_make_assertion({
    line: 9,
    from: 148,
    to: 159,
    name: 1,
    description: ['We\'re testing the "main" function which returns 42 when called.'],
    content: 'result > 43',
    result: result > 43
});
_make_assertion({
    line: 10,
    from: 163,
    to: 189,
    name: 2,
    description: ['We\'re testing the "main" function which returns 42 when called.'],
    content: 'typeof result === \'number\'',
    result: typeof result === 'number'
});
/* @action didPublishGroups */
(_publish_named_groups({}));
};
