import { assert, beforeEach, snap, capture } from "../index.js";
var json = {
    "nice": true
};
capture(json);
snap("y");
y = -1;
beforeEach(() => {
    y = y + 1;
});
async function main() {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(42);
        }, 500);
    });
}
let result = await main();
for (let i = 0; i < 5; i++) {
    assert(y == i);
}
assert(result == 42);
