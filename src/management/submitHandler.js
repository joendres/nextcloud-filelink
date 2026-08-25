// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CloudConnection } from "../lib/cloudconnection.js";
import { Popup } from "./popup/popup.js";
import { Sanitize } from "./sanitize.js";
import { updateForm } from "./updateform.js";
import { refreshCloudProperties } from "../lib/refreshcloudproperties.js";
import { FreeSpaceDisplay } from "./freespacedisplay.js";

/**
 * 
 * @param {Account} account
 * @param {CloudCapabilities} capabilities 
 */
function makeSubmitHandler(account, capabilities) {
    /**
     * @param {SubmitEvent} event
     */
    return async function (event) {
        lookBusy(true);
        event.preventDefault();

        Popup.clear();

        // Sanitize form values in place
        sanitizeFormValues();

        // Determine changed fields by comparing to account
        const changes = listChanges(account);
        await account.updateAndStore(changes);

        if ( // Login data changed, possibly because it didn't work
            ["serverUrl", "username", "password",].some(k => k in changes) ||
            // or the account is not configured
            !(await account.usable())) {

            const error = await refreshCloudProperties(account, capabilities, true);
            if (error) {
                Popup.error(error);
            }
            FreeSpaceDisplay.updateFromCloud(account, capabilities);
        } else {
            FreeSpaceDisplay.showIfValid();
        }

        if ("downloadPassword" in changes && account.oneDLPassword) {
            // Validate the downloadPassword if it was changed and is in use
            await validateDLPassword(account, capabilities)
        }

        await updateForm(account, capabilities);

        if (Popup.empty()) {
            Popup.success();
        }

        lookBusy(false);
    }
}

/**
 * Enable or disable the busy look (Set the busy cursor and deactivate all inputs)
 * @param {boolean} busy If true enable the busy look, if false disable it
 */
function lookBusy(busy) {
    const disableable_fieldset = document.getElementById("disableable_fieldset");

    const body = document.querySelector("body");
    disableable_fieldset.disabled = busy;
    if (busy) {
        body.classList.add('busy');
    } else {
        body.classList.remove('busy');
    }
}

/**
 * Sanitize the field values in place
 */
function sanitizeFormValues() {
    const accountForm = document.getElementById("accountForm");
    // For every input: If Sanitize has a method of the same name, apply it
    for (const element of accountForm.querySelectorAll("input")) {
        if (Object.hasOwn(Sanitize, element.id)) {
            element.value = Sanitize[element.id](element.value);
        }
    }

    const password = document.getElementById("password");
    if (!password.value.match(/^[\x20-\x7e]+$/)) {
        Popup.warn('nonascii_password');
    }
}

/**
 * Compare the form contents to the account
 * @param {import("../lib/account.js").Account} account 
 * @returns {{string:*}} An object containing the new values indexed by id of the input element
 */
function listChanges(account) {
    const changes = {};
    const accountForm = document.getElementById("accountForm");
    for (const element of accountForm.querySelectorAll("input")) {
        if (Object.hasOwn(account, element.id) && account[element.id] !== element.value) {
            if (element.type === "checkbox" || element.type === "radio") {
                changes[element.id] = element.checked;
            } else {
                changes[element.id] = element.value;
            }
        }
    }
    return changes;
}

/**
 * Try to validate download password using the validateion service NC>=17
 * offers in the Passwordpolicy App. Shows a warning if validation via the API
 * returns invalid, otherwise does nothing
 * @param {Account} account 
 * @param {CloudCapabilities} capabilities
 */
async function validateDLPassword(account, capabilities) {
    if (capabilities.password_validate_url) {
        const cc = new CloudConnection(account);
        const result = await cc.validateDLPassword(account.downloadPassword, capabilities.password_validate_url);
        if (false === result.passed) {
            Popup.error('invalid_pw', result.reason);
        }
    }
}

export { makeSubmitHandler }