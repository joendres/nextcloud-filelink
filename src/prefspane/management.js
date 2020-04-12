/* MIT License

Copyright (c) 2020 Johannes Endres

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

/* global CloudConnection */
/* global popup */

const accountId = new URL(location.href).searchParams.get("accountId");
const ncc = new CloudConnection(accountId);

//#region direct access to html elements
const freeSpaceGauge = document.getElementById("freespaceGauge");

const serverUrl = document.getElementById("serverUrl");
const username = document.getElementById("username");
const password = document.getElementById("password");
const storageFolder = document.getElementById("storageFolder");
const useDlPassword = document.getElementById("useDlPassword");
const downloadPassword = document.getElementById("downloadPassword");
const useExpiry = document.getElementById("useExpiry");
const expiryDays = document.getElementById("expiryDays");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const all_inputs = document.querySelectorAll("input");

const provider_management = document.querySelector("body");
//#endregion
//#region main
(() => {

    loadFormData()
        .then(updateHeader);

    addLocalizedLabels();

    linkButtonStateToFieldChanges();

    serverUrl.addEventListener("input", updateHeader);
    username.addEventListener("input", updateGauge);

    linkElementStateToCheckbox(downloadPassword, useDlPassword);
    linkElementStateToCheckbox(expiryDays, useExpiry);

})();
//#endregion

//#region html element event handlers
/**
 * Save button is only active if field values validate OK
 * Reset button is only active if any field has been changed
 */
async function linkButtonStateToFieldChanges() {
    function updateButtons() {
        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }

    const accountForm = document.getElementById("accountForm");

    accountForm.addEventListener('input', updateButtons);

}

/**
 *  enable/disable text input field according to checkbox state
 */
async function linkElementStateToCheckbox(element, checkbox) {
    checkbox.addEventListener("change", async () => {
        element.disabled = !checkbox.checked;
        element.required = !element.disabled;
    });
}

/** 
 * Handler for Cancel button, restores saved values
 */
resetButton.addEventListener('click', () => {
    popup.clear();
    loadFormData()
        .then(updateHeader);
    resetButton.disabled = saveButton.disabled = true;
});

/** Handler for Save button */
saveButton.addEventListener('click', () => {
    saveButton.disabled = resetButton.disabled = true;
    Promise.all([lookBusy(), handleFormData(), popup.clear(),])
        .then(() => {
            updateHeader();
            stopLookingBusy();
        });
});

//#endregion
//#region Fill visible html elements with content
/**
 * Set all the labels to localized strings
 */
async function addLocalizedLabels() {
    document.querySelectorAll("[data-message]")
        .forEach(element => {
            element.innerHTML = browser.i18n.getMessage(element.dataset.message);
        });
}

/**
 * Display cloud type (as a logo) and version
 */
async function showVersion() {
    const logo = document.getElementById('logo');
    const cloud_version = document.getElementById('cloud_version');
    const provider_name = document.getElementById('provider-name');

    document.getElementById('service_url').href = serverUrl.value.trim();

    provider_name.textContent = '*cloud';
    logo.src = "images/management.png";
    cloud_version.textContent = "";

    if (serverUrl.value.trim() === ncc.serverUrl && 'undefined' !== typeof ncc.cloud_supported) {
        cloud_version.textContent = ncc.cloud_versionstring;
        provider_name.textContent = ncc.cloud_productname || '*cloud';
        logo.src = {
            "Nextcloud": "images/nextcloud-logo.svg",
            "ownCloud": "images/owncloud-logo.svg",
            "Unsupported": "images/management.png",
        }[ncc.cloud_type];

        if (!ncc.cloud_supported) {
            document.getElementById("obsolete_string").hidden = false;
        }
    }
}

/**
 * Update free space gauge
 */
async function updateGauge() {
    // Only show gauge if relevant form data match the account data
    if (username.value !== ncc.username || serverUrl.value !== ncc.serverUrl) {
        freeSpaceGauge.style.visibility = "hidden";
    } else {
        let theAccount = await browser.cloudFile.getAccount(accountId);
        // Update the free space gauge
        let free = theAccount.spaceRemaining;
        const used = theAccount.spaceUsed;
        if (free >= 0 && used >= 0) {
            const full = (free + used) / (1024.0 * 1024.0 * 1024.0); // Convert bytes to gigabytes
            free /= 1024.0 * 1024.0 * 1024.0;
            document.getElementById("freespacelabel").textContent = browser.i18n.getMessage("freespace", [
                free > 100 ? free.toFixed() : free.toPrecision(2),
                full > 100 ? full.toFixed() : full.toPrecision(2),]);
            const meter = document.getElementById("freespace");
            meter.max = full;
            meter.value = free;
            meter.low = full / 10;
            freeSpaceGauge.style.visibility = "visible";
        }
    }
}

function updateHeader() {
    return Promise.all([showVersion(), updateGauge(),]);
}

/**
 * Load stored account data into form
 */
async function loadFormData() {
    await ncc.load();

    all_inputs
        .forEach(inp => {
            if (inp.type === "checkbox") {
                inp.checked = !!ncc[inp.id];
            } else if (ncc[inp.id]) {
                inp.value = ncc[inp.id];
            }
        });

    // Don't allow longer expiry period than the server
    if (ncc.expiry_max_days) {
        document.getElementById("expiryDays").max = ncc.expiry_max_days;
    }

    // force download password if server requires one
    if (ncc.enforce_password) {
        useDlPassword.checked = true;
        useDlPassword.disabled = true;
    }

    downloadPassword.disabled = !useDlPassword.checked;
    downloadPassword.required = useDlPassword.checked;

    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = useExpiry.checked;
}
//#endregion

//#region Helpers
/**
 * Part of the save button handler
 */
async function handleFormData() {

    sanitizeInput();

    // If user typed new password, username or URL the token is likely not valid any more
    const needsNewToken = password.value !== ncc.password ||
        username.value !== ncc.username ||
        serverUrl.value !== ncc.serverUrl;

    copyData();

    // Try to convert the password into App Token if necessary
    if (needsNewToken) {
        ncc.convertToApppassword()
            .then(pw => { password.value = pw; });
    }

    // Store account data and update configured state
    await ncc.store();
    ncc.updateConfigured();

    // Get info from cloud
    await updateCloudInfo();

    // Done. Now internal functions
    function sanitizeInput() {
        all_inputs
            .forEach(element => {
                element.value = element.value.trim();
            });
        serverUrl.value = serverUrl.value.replace(/\/+$/, "");
        storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');
    }

    /**
     * Copy data into the connection object
     */
    function copyData() {
        all_inputs
            .forEach(inp => {
                if (inp.type === "checkbox") {
                    ncc[inp.id] = inp.checked;
                }
                else {
                    ncc[inp.id] = inp.value;
                }
            });
    }

    /**
     * Try login data by fetching Quota. If that succeeds, get capabilities and
     * store them in the Cloudconnection object,inform user about it.
     */
    async function updateCloudInfo() {
        ncc.forgetCapabilities();
        const answer = await ncc.updateFreeSpaceInfo();
        if (answer._failed) {
            popup.error(answer.status);
        }
        else {
            await getCapabilities();
        }

        // Inner functions of getCloudInfo
        /**
         * Get capabilities from cloud, change input form to meet policies, inform user
         */
        async function getCapabilities() {
            await ncc.updateCapabilities();
            if (!ncc.public_shares_enabled) {
                popup.error('sharing_off');
            }
            else {
                let account_ok = true;
                account_ok = checkEnforcedExpiry(account_ok);
                account_ok = checkEnforcedDLPassword(account_ok);
                account_ok = await validateDLPassword(account_ok);
                if (false === ncc.cloud_supported) {
                    popup.warn('unsupported_cloud');
                    account_ok = false;
                }
                if (true === account_ok) {
                    popup.success();
                } else {
                    ncc.store();
                }
            }

            /**
             * Try to validate download password
             * AFAIK this only works with NC >=17, so ignore all errors.
             * @param {boolean} account_ok Are the account data OK so far?
             * @returns {boolean} account_ok || error in this check
             */
            async function validateDLPassword(account_ok) {
                if (useDlPassword.checked) {
                    const result = await ncc.validateDLPassword();
                    if (false === result.passed) {
                        popup.error('invalid_pw', result.reason || '(none)');
                        account_ok = false;
                    }
                }
                return account_ok;
            }

            /**
             * If password is enforced, make it mandatory by changing the inputs
             * @param {boolean} account_ok Are the account data OK so far?
             * @returns {boolean} account_ok || error in this check
             */
            function checkEnforcedDLPassword(account_ok) {
                if (ncc.enforce_password && !useDlPassword.checked) {
                    useDlPassword.checked = true;
                    useDlPassword.disabled = true;
                    downloadPassword.disabled = false;
                    downloadPassword.required = true;
                    popup.error('password_enforced');
                    account_ok = false;
                }
                return account_ok;
            }

            /**
             * Check for maximum expiry on server
             * @param {boolean} account_ok Are the account data OK so far?
             * @returns {boolean} account_ok || error in this check
             */
            function checkEnforcedExpiry(account_ok) {
                if (ncc.expiry_max_days) {
                    const expiry_input = document.getElementById("expiryDays");
                    expiry_input.max = ncc.expiry_max_days;
                    if (parseInt(expiry_input.value) > ncc.expiry_max_days) {
                        expiry_input.value = ncc.expiry_max_days;

                        ncc.expiryDays = ncc.expiry_max_days;
                        popup.warn('expiry_too_long', ncc.expiry_max_days);
                        account_ok = false;
                    }
                }
                return account_ok;
            }
        }
    }
}

/**
* Set the busy cursor and deactivate all inputs
*/
async function lookBusy() {
    provider_management.classList.add('busy');
    document.getElementById('disableable_fieldset').disabled = true;
}

/**
 * Hide the busy cursor and reactivate all fields that were active
 */
function stopLookingBusy() {
    document.getElementById('disableable_fieldset').disabled = false;
    provider_management.classList.remove('busy');
}
//#endregion