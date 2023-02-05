// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: "./test/test_runner.html", });
});
