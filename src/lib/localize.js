// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Set all the labels to localized strings
 */
async function addLocalizedLabels() {
    document.querySelectorAll("[data-message]")
        .forEach(element => {
            element.textContent = browser.i18n.getMessage(element.dataset.message);
        });
}

/* exported addLocalizedLabels */