// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { applyCloudConstraints } from "./applycloudconstraints.js";
import { showVersion } from "./header.js";
import { Popup } from "./popup/popup.js";
import { updateElementStates } from "./updateelementstates.js";

/**
 * Load stored account data and capabilities into form
* @param {import("../lib/account.js").Account} account 
* @param {import("../lib/cloudcapabilities.js").CloudCapabilities} capabilities 
*/
async function updateForm(account, capabilities) {
    // Initialize the form
    fillFormFrom(account);
    // If the cloud enforces settings, change the form accordingly
    applyCloudConstraints(capabilities);

    updateElementStates();
    await initialButtonState(account);

    // Show the header
    showVersion(capabilities, account.serverUrl);

    showErrors(account, capabilities);
}

function fillFormFrom(account) {
    document.querySelectorAll("input")
        .forEach(inp => {
            if (inp.type === "checkbox" || inp.type === "radio") {
                inp.checked = !!account[inp.id];
            } else if (account[inp.id]) {
                inp.value = account[inp.id];
            }
        });

    // disable settings marked as "locked" in enterprise policy
    if (account.lockedSettings) {
        for (const id of account.lockedSettings) {
            // This works as long as only serverUrl, username, password and
            // storageFolder may be locked. Later it might interfere with
            // enforcements by the cloud.
            document.getElementById(id).disabled = true;
        }
    }
}

/**
 * @param {import("../lib/account.js").Account} account 
 * @param {import("../lib/cloudcapabilities.js").CloudCapabilities} capabilities 
 */
function showErrors(account, capabilities) {
    if (!capabilities.public_shares_enabled) {
        Popup.error('sharing_off');
    } else {
        if (!capabilities.supported_version) {
            Popup.warn('unsupported_cloud');
        }
        if (account.serverUrl && !account.serverUrl.startsWith("https:")) {
            Popup.warn("insecure_http");
        }
    }
}

/**
 * 
 * @param {Account} account 
 */
async function initialButtonState(account) {
    const accountForm = document.getElementById('accountForm');
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById("resetButton");

    // Enable the Save button if the form contains valid data and the account
    // is not in configured state
    saveButton.disabled = !accountForm.checkValidity() || await account.usable();
    resetButton.disabled = true;
}

export { updateForm }