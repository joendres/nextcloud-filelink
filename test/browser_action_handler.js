browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: "./test/test_runner.html?grep=TBVersionWorkarounds", });
});
