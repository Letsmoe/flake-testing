import { hasSubstring as hasSubstring } from "../lib/test.js";

export default function(_make_assertion = () => {}, _publish_named_groups = () => {}, _set_await_assertion_count = () => {}, _import_module = () => {}, _register_action = () => {}) {
(_set_await_assertion_count(1));
_import_module([{
        name: 'hasSubstring',
        local: 'hasSubstring',
        default: false
    }], '../lib/test.js');
_register_action('afterAll', () => {
    console.log('Succeeded');
});
_make_assertion(0, 15, ['This should complete since the result is always true.'], 'hasSubstring(\'awd\', \'a\') === false', hasSubstring('awd', 'a') === false);
(_publish_named_groups({}));
};
