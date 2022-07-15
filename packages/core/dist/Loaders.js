export var DEFAULT_LOADERS = [
    {
        test: ".*\\.(?:test|spec)\\.(?:js)",
        use: [
            {
                loader: "@flake-universal/javascript",
            },
        ],
    },
    {
        test: ".*\\.(?:test|spec)\\.(?:py)",
        use: [
            {
                loader: "@flake-universal/python",
                options: {
                    pythonExecutable: "python"
                }
            },
        ],
    }
];
//# sourceMappingURL=Loaders.js.map