// Copyright (C) 2020-2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Set all the labels to localized strings
 */
document.querySelectorAll("[data-message]")
    .forEach(element => {
        element.textContent = browser.i18n.getMessage(element.dataset.message);
    });
