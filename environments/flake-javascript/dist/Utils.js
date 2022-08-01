export function getLine(index = 3) {
    var e = new Error();
    if (!e.stack)
        try {
            // IE requires the Error to actually be throw or else the Error's 'stack'
            // property is undefined.
            throw e;
        }
        catch (e) {
            if (!e.stack) {
                return 0; // IE < 10, likely
            }
        }
    var stack = e.stack.toString().split(/\r\n|\n/);
    // Since this is the second frame we entered when calling this function, we need to get the fourth (one-based) index in the call stack.
    /**
     * [
        'Error',
        '    at getLine (file:///home/moritz/Documents/Continuum-Projects/flake-javascript/dist/Snap.js:33:13)',
        '    at set (file:///home/moritz/Documents/Continuum-Projects/flake-javascript/dist/Snap.js:27:13)',
        '    at file:///home/moritz/Documents/Continuum-Projects/flake-javascript/dist/test/main.test.js:4:3', <<<---- THIS ONE RIGHT HERE!
        ]
     */
    var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
    let frame = stack[index];
    let line = parseInt(frameRE.exec(frame)[1]);
    return line;
}
