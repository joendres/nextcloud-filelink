// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Popup } from "./popup/popup.js";
import { updateForm } from "./updateform.js";

/**
 * 
 * @param {Account} account 
 * @param {CloudCapabilities} capabilities  
 */
function makeResetHandler(account, capabilities) {
    /**
     * @param {Event} event
     */
    return function (event) {
        event.preventDefault();
        Popup.clear();
        updateForm(account, capabilities);
    }
}

export { makeResetHandler }