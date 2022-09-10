mocha.setup({
    ui: "bdd",
    globals: [
        "browser",
        "punycode",]
});
mocha.checkLeaks();
