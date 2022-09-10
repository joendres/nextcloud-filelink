mocha.setup({
    ui: "bdd",
    globals: [
        "punycode",
    ],
    checkLeaks: true,
    forbidPending: false,
});
