// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

const accountId = new URL(location.href).searchParams.get("accountId");
const ncc = new CloudConnection(accountId);

loadFormData()
    .then(updateHeader)
    .then(showErrors);

addLocalizedLabels();

serverUrl.addEventListener("input", updateHeader);
username.addEventListener("input", updateGauge);
accountForm.addEventListener('input', updateButtons);
document.getElementsByName("DLPRadio")
    .forEach(inp => inp.addEventListener("change", () => {
        adjustDLPasswordElementStates();
        updateButtons();
    }));

linkElementStateToCheckbox(expiryDays, useExpiry);

//#region html element event handlers
/**
 * Save button is only active if field values validate OK
 * Reset button is only active if any field has been changed
 */
function updateButtons() {
    saveButton.disabled = !accountForm.checkValidity();
    resetButton.disabled = false;
}

/**
 *  enable/disable text input field according to checkbox state
 */
async function linkElementStateToCheckbox(element, checkbox) {
    checkbox.addEventListener("input", async () => {
        element.disabled = !checkbox.checked;
        element.required = !element.disabled;
    });
}

/** 
 * Handler for Password protect downloads radio buttons
 */
function adjustDLPasswordElementStates() {
    downloadPassword.disabled = !oneDLPassword.checked;
    downloadPassword.required = oneDLPassword.checked;
    useDlPassword.checked = oneDLPassword.checked || useGeneratedDlPassword.checked;
}

/** 
 * Handler for Cancel button, restores saved values
 */
accountForm.addEventListener("reset", () => {
    popup.clear();
    loadFormData()
        .then(updateHeader);
    resetButton.disabled = saveButton.disabled = true;
});

/** Handler for Save button */
accountForm.addEventListener("submit", evt => {
    lookBusy();
    saveButton.disabled = resetButton.disabled = true;
    popup.clear();
    handleFormData()
        .then(() => {
            updateHeader();
            stopLookingBusy();
        });
    evt.preventDefault();
});

//#endregion
//#region Fill visible html elements with content
/**
 * Display cloud type (as a logo) and version
 */
async function showVersion() {
    service_url.href = serverUrl.value.trim();

    if (serverUrl.value.trim() === ncc.serverUrl && 'undefined' !== typeof ncc.cloud_supported) {
        cloud_version.textContent = ncc.cloud_versionstring;
        provider_name.textContent = ncc.cloud_productname || '*cloud';
        logo.src = {
            "Nextcloud": "images/nextcloud-logo.svg",
            "ownCloud": "images/owncloud-logo.svg",
            "oCIS": "images/owncloud-logo.svg",
            "Unsupported": "../../icon48.png",
        }[ncc.cloud_type];

        if (!ncc.cloud_supported) {
            obsolete_string.hidden = false;
        }
    } else {
        provider_name.textContent = '*cloud';
        logo.src = "../../icon48.png";
        cloud_version.textContent = "";
    }
}

/**
 * Update free space gauge
 */
async function updateGauge() {
    freespaceGauge.style.visibility = "hidden";
    // Only show gauge if relevant form data match the account data
    if (username.value === ncc.username && serverUrl.value === ncc.serverUrl) {
        let theAccount = await messenger.cloudFile.getAccount(accountId);
        // Update the free space gauge
        const free = parseInt(theAccount.spaceRemaining);
        const full = free + parseInt(theAccount.spaceUsed);
        if (free >= 0 && full >= 0 &&
            free <= Number.MAX_SAFE_INTEGER && full <= Number.MAX_SAFE_INTEGER &&
            isFinite(free) && isFinite(full)) {
            freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                humanReadable(free),
                humanReadable(full),]);
            freespace.max = full;
            freespace.value = free;
            freespace.low = full / 10;
            freespaceGauge.style.visibility = "visible";
        }
    }

    function humanReadable(bytes) {
        const units = ["B", "kB", "MB", "GB", "TB", "PB",];
        let n = bytes;
        let s = "";
        let i = -1;
        do {
            s = n.toPrecision(2);
            n /= 1000;
            if (i++ >= units.length) {
                throw ReferenceError("parameter bytes too big");
            }
        } while (s.match(/e/));
        return s.replace(/(\.\d+)0$/, "$1").replace(/\.0$/, "") + units[i];
    }
}

function updateHeader() {
    return Promise.all([showVersion(), updateGauge(),]);
}

function showErrors() {
    if (ncc.laststatus) {
        popup.error(ncc.laststatus);
    } else if (false === ncc.public_shares_enabled) {
        popup.error('sharing_off');
    } else {
        if (ncc.enforce_password && (!useDlPassword.checked || (!downloadPassword.value && !useGeneratedDlPassword.checked))) {
            popup.error('password_enforced');
        }
        if (ncc.invalid_downloadpassword_reason) {
            popup.error('invalid_pw', ncc.invalid_downloadpassword_reason);
        }
        if (false === ncc.cloud_supported) {
            popup.warn('unsupported_cloud');
        }
        if (serverUrl.value.startsWith("http:")) {
            popup.warn("insecure_http");
        }
    }
}

/**
 * Load stored account data into form
 */
async function loadFormData() {
    await ncc.load();

    document.querySelectorAll("input")
        .forEach(inp => {
            if (inp.type === "checkbox" || inp.type === "radio") {
                inp.checked = !!ncc[inp.id];
            } else if (ncc[inp.id]) {
                inp.value = ncc[inp.id];
            }
        });
    useNoDlPassword.checked = !useDlPassword.checked && !useGeneratedDlPassword.checked;

    // Don't allow longer expiry period than the server
    checkEnforcedExpiry();

    // force download password if server requires one
    if (ncc.enforce_password) {
        useNoDlPassword.disabled = true;
        useNoDlPassword.checked = false;
        oneDLPassword.checked = !useGeneratedDlPassword.checked;
        advanced_options.open = true;
    }
    adjustDLPasswordElementStates();

    ocisHasNoDownloadLinks();
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

    // Check login and get info from cloud
    await updateCloudInfo();

    // Try to convert the password into App Token if necessary
    if (needsNewToken) {
        if (await ncc.convertToApppassword()) {
            password.value = ncc.password;
            username.value = ncc.username;
        }
    }

    await ncc.updateConfigured();
    ncc.store();

    showErrors();
    if (popup.empty()) {
        popup.success();
    }
    // Done. Now internal functions

    function sanitizeInput() {
        document.querySelectorAll("input")
            .forEach(element => {
                element.value = element.value.trim();
            });
        // Remove extra slashes from folder path
        storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');

        const url = new URL(serverUrl.value);
        // Remove double slashes from url
        let shortpath = url.pathname.split('/').filter(e => "" !== e);

        // If user pasted complete url of file app, extract cloud base url
        shortpath = guessPath(shortpath);
        serverUrl.value = url.origin + '/' + shortpath.join('/');

        // Make sure, url end with a slash
        if (!serverUrl.value.endsWith('/')) {
            serverUrl.value += '/';
        }

        if (!password.value.match(/^[\x21-\x7e]+$/)) {
            popup.warn('nonascii_password');
        }
    }

    /**
     * Removes any known part of Nextcloud/ownCloud/oCIS app paths from the end
     * of the guess the base path.
     * @param {string[]} shortpath The path, split at th /s 
     * @returns string[] An array of the remaining path elements
     */
    function guessPath(shortpath) {
        // Path parts to exclude, taken from Nextcloud, ownCloud, oCIS
        const known_path_parts = [
            username.value,
            "apps",
            "dashboard",
            "extstoragemounts",
            "favorites",
            "files",
            "folders",
            "groupfolders",
            "identifier",
            "index.php",
            "login",
            "personal",
            "projects",
            "recent",
            "shareoverview",
            "shares",
            "signin",
            "spaces",
            "trash",
            "v1",
        ];
        while (known_path_parts.includes(shortpath[shortpath.length - 1])) {
            shortpath.pop();
        }
        return shortpath;
    }

    /**
     * Copy data into the connection object
     */
    function copyData() {
        document.querySelectorAll("input")
            .forEach(inp => {
                if (inp.type === "checkbox" || inp.type === "radio") {
                    ncc[inp.id] = inp.checked;
                }
                else {
                    ncc[inp.id] = inp.value;
                }
            });
    }

    /**
     * Try login data by fetching user id. If that succeeds, get quota and capabilities and
     * store them in the Cloudconnection object.
     */
    async function updateCloudInfo() {
        let answer = await ncc.updateUserId();
        ncc.laststatus = null;
        if (answer._failed) {
            // If login failed, we might be using an app token which requires a lowercase user name
            const oldname = ncc.username;
            ncc.username = ncc.username.toLowerCase();
            answer = await ncc.updateUserId();
            if (answer._failed) {
                // Nope, it's not the case, restore username
                ncc.username = oldname;
            }
        }
        if (answer._failed) {
            ncc.laststatus = answer.status;
        } else {
            ncc.forgetCapabilities();
            await Promise.all([ncc.updateFreeSpaceInfo(), getCapabilities(),]);
        }

        // Inner functions of getCloudInfo
        /**
         * Get capabilities from cloud, change input form to meet policies, inform user
         */
        async function getCapabilities() {
            await ncc.updateCapabilities();
            if (true === ncc.public_shares_enabled) {
                checkEnforcedExpiry();
                checkEnforcedDLPassword();
                ocisHasNoDownloadLinks();
                await validateDLPassword();
                ncc.store();
            } else if ('undefined' === typeof ncc.public_shares_enabled) {
                popup.warn('no_config_check');
            }

            /**
             * Try to validate download password
             * AFAIK this only works with NC >=17, so ignore all errors.
             */
            async function validateDLPassword() {
                delete ncc.invalid_downloadpassword_reason;
                if (useDlPassword.checked && !useGeneratedDlPassword.checked) {
                    const result = await ncc.validateDLPassword();
                    if (false === result.passed) {
                        ncc.invalid_downloadpassword_reason = result.reason || '(none)';
                    }
                }
            }

            /**
             * If password is enforced, make it mandatory by changing the inputs
             */
            function checkEnforcedDLPassword() {
                if (ncc.enforce_password) {
                    useNoDlPassword.disabled = true;
                    useNoDlPassword.checked = false;
                    oneDLPassword.checked = !useGeneratedDlPassword.checked;
                    adjustDLPasswordElementStates();
                    advanced_options.open = true;
                } else {
                    useNoDlPassword.disabled = false;
                }
            }
        }
    }
}

/**
 * ownCloud Infinite Scale does not support the /download postfix on shared
 * links. Force file info links for oCIS servers.
 */
function ocisHasNoDownloadLinks() {
    if (ncc.cloud_type === "oCIS") {
        if (!noAutoDownload.checked) {
        noAutoDownload.checked = true;
            popup.warn('ocis_no_download_links');
        }
        noAutoDownload.disabled = true;
    }
}

/**
 * Check for maximum expiry on server
 */
function checkEnforcedExpiry() {
    if (ncc.expiry_max_days) {
        expiryDays.max = ncc.expiry_max_days;
        ncc.expiryDays = useExpiry.checked ? Math.min(expiryDays.value, ncc.expiry_max_days) : ncc.expiry_max_days;
        expiryDays.value = ncc.expiryDays;
        useExpiry.checked = true;
        useExpiry.disabled = true;
    } else {
        expiryDays.removeAttribute('max');
        useExpiry.disabled = false;
    }
    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = useExpiry.checked;
}

/**
* Set the busy cursor and deactivate all inputs
*/
async function lookBusy() {
    document.querySelector("body").classList.add('busy');
    disableable_fieldset.disabled = true;
}

/**
 * Hide the busy cursor and reactivate all fields that were active
 */
function stopLookingBusy() {
    disableable_fieldset.disabled = false;
    document.querySelector("body").classList.remove('busy');
}
//#endregion
// Make jshint happy
// Defined in ../lib/cloudconnection.js
/* global CloudConnection */
// Defined in popup/popup.js
/* global popup */
// Defined in managemet.html as id
/* globals serverUrl, username, expiryDays */
/* globals downloadPassword, useDlPassword, useNoDlPassword, useGeneratedDlPassword, oneDLPassword*/
/* globals useExpiry, saveButton, accountForm, resetButton, service_url, advanced_options */
/* globals provider_name, logo, cloud_version, obsolete_string, freespaceGauge */
/* globals freespacelabel, freespace, password, storageFolder, disableable_fieldset */
// Defined in ../lib/localize.js
/* globals addLocalizedLabels */
/* globals noAutoDownload */