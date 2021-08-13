module.exports = {
    ignoreFiles: [
        "punycode/package.json",
        "punycode/README.md",
        "punycode/punycode.es6.js",
        "punycode/scripts",
        "punycode/tests",
        "photon-components-web/index.js",
        "photon-components-web/images/arrow-grey-40-*.svg",
        "photon-components-web/images/open-in-new-16-*.svg",
        "photon-components-web/images/searchfield-cancel-*.svg",
    ],
    sourceDir: "src",
    run: {
        // WEB_EXT_FIREFOX_PROFILE=~/.thunderbird/x8cwyjqz.Debug/;export WEB_EXT_FIREFOX_PROFILE
        // WEB_EXT_FIREFOX=~/thunderbird/thunderbird; export WEB_EXT_FIREFOX
        browserConsole: true,
    },
    build: {
        overwriteDest: true,
    }
};
