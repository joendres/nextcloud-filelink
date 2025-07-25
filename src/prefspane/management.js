// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

const accountId = new URL(location.href).searchParams.get("accountId");
const ncc = new CloudConnection(accountId);

loadFormData()
    .then(updateHeader)
    .then(showErrors);

serverUrl.addEventListener("input", updateHeader);
username.addEventListener("input", updateFreeSpaceDisplay);
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
        logo.src = ncc.cloud_logo_url || "../../icon48.png";

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
async function updateFreeSpaceDisplay() {
    // the default mail.compose.big_attachments.threshold_kb
    const threshold_kb = 5120;

    freespaceDisplay.style.visibility = "hidden";
    freespacelabel.classList.remove('freespace_low');
    // Only show free space if relevant form data match the account data
    if (username.value === ncc.username && serverUrl.value === ncc.serverUrl) {
        // Update the free space display
        if (ncc.spaceRemaining >= 0 && ncc.spaceRemaining <= Number.MAX_SAFE_INTEGER) {
            freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                humanReadable(ncc.spaceRemaining),]);
            freespaceDisplay.style.visibility = "visible";
            if (ncc.spaceRemaining < threshold_kb) {
                freespacelabel.classList.add('freespace_low');
            }
        }
    }

    /**
     * Format a positiv size in bytes with decimal based units like GB or TB. The number is truncated at the decimal point.
     * @param {number} bytes 
     * @returns A number followed by a space and the unit. "0 B" for negative input.
     */
    function humanReadable(bytes) {
        const units = [' B', ' KB', ' MB', ' GB', ' TB', ' PB',];

        if (!(bytes > 0)) return '0 B';

        const pow = Math.min(
            Math.floor(Math.log10(bytes) / 3),
            units.length - 1
        );

        return (bytes / Math.pow(1000, pow)).toFixed(0) + units[pow];
    }
}

function updateHeader() {
    return Promise.all([showVersion(), updateFreeSpaceDisplay(),]);
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

    updateHeader();
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

        // As we check the string format before, this cannot fail(TM)
        const url = new URL(serverUrl.value);

        // If user pasted complete url of file app, extract cloud base url
        serverUrl.value = url.origin + '/' + guessPath(url.pathname);

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
     * @param {string} path The path 
     * @returns string The shortend path
     */
    function guessPath(path) {
        // URL path parts that mark the start of the internal call route.
        // Everything before that is considered part of the base path.
        // Heuristically taken from Nextcloud 30.0.4, ownCloud 10.15.0,
        // oCIS Web UI 11.0.6
        const known_path_parts = [
            'account', // oCIS
            'apps', // *cloud after login
            'files',  // oCIS
            'index.php', // *cloud, depending on configuration
            'login', // *cloud before login
            'settings', // *cloud
            'signin', // oCIS before login
            'text-editor', // oCIS
        ];
        // Split into parts and remove double slashes
        const shortpath = path.split('/').filter(e => !!e);

        for (let index = 0; index < shortpath.length; index++) {
            if (known_path_parts.includes(shortpath[index])) {
                return shortpath.slice(0, index).join('/');
            }
        }
        return shortpath.join(('/'));
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

// Defined in ../lib/cloudconnection.js
/* global CloudConnection */
// Defined in popup/popup.js
/* global popup */
// Defined in managemet.html as id
/* globals serverUrl, username, expiryDays */
/* globals downloadPassword, useDlPassword, useNoDlPassword, useGeneratedDlPassword, oneDLPassword*/
/* globals useExpiry, saveButton, accountForm, resetButton, service_url, advanced_options */
/* globals provider_name, logo, cloud_version, obsolete_string, freespaceDisplay */
/* globals freespacelabel, password, storageFolder, disableable_fieldset */
// Defined in ../lib/localize.js
/* globals noAutoDownload */
