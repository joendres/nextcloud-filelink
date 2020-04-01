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
const hiddenVersion = document.getElementById("versionstring");
const hiddenType = document.getElementById("cloudtype");
const hiddenProductname = document.getElementById("productname");

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
    fillFormWithStoredData()
        .then(updateCloudversion)
        .then(updateGauge);

    addLocalizedLabels();

    linkButtonStateToFieldChanges();

    linkUrlchangeToCloudversion();
    serverUrl.addEventListener("change", updateGauge);
    username.addEventListener("change", updateGauge);

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
    const accountForm = document.getElementById("accountForm");

    function updateButtons() {
        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }

    ["input", "change",].forEach(ev => {
        accountForm.addEventListener(ev, updateButtons);
    });
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
 * Get cloud flavor and version as soon as we have an url
 */
async function linkUrlchangeToCloudversion() {
    serverUrl.addEventListener("change", async () => {
        // this is only triggered if the field value really changed
        serverUrl.value = serverUrl.value.trim();
        if (serverUrl.checkValidity()) {
            await getCloudVersion(serverUrl.value);
        }
        updateCloudversion();
    });
}

/** 
 * Handler for Cancel button, restores saved values
 */
resetButton.onclick = async () => {
    popup.clear();
    fillFormWithStoredData()
        .then(updateCloudversion)
        .then(updateGauge);
    resetButton.disabled = saveButton.disabled = true;
};

/** Handler for Save button */
saveButton.onclick = async () => {
    const states = lookBusy();

    // Sanitize input
    all_inputs
        .forEach(element => {
            element.value = element.value.trim();
        });
    serverUrl.value = serverUrl.value.replace(/\/+$/, "");
    storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');

    // If user typed new password, username or URL the token is likely not valid any more
    const needsNewToken = password.value !== ncc.password ||
        username.value !== ncc.username ||
        serverUrl.value !== ncc.serverUrl;

    // Copy data into the connection object
    all_inputs
        .forEach(inp => {
            if (inp.type === "checkbox") {
                ncc[inp.id] = inp.checked;
            } else {
                ncc[inp.id] = inp.value;
            }
        });

    // Try to convert the password into App Token if necessary
    if (needsNewToken) {
        password.value = await ncc.convertToApppassword();
    }

    // Store account data and update configured state
    ncc.store()
        .then(ncc.updateConfigured());

    // Re-activate form
    stopLookingBusy(await states);

    // Update header
    ncc.updateFreeSpaceInfo()
        .then(updateGauge);
};
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

/**
 * update cloud version display
 */
async function updateCloudversion() {
    // Show cloud flavor and version
    document.getElementById("cloud_version").textContent = hiddenVersion.value;
    document.getElementById("service_url").href = serverUrl.value;
    if (hiddenProductname.value && hiddenProductname.value !== "undefined") {
        document.getElementById("provider-name").textContent = hiddenProductname.value;
    } else {
        document.getElementById("provider-name").textContent = "*cloud";
    }

    document.getElementById("logo").hidden = false;
    document.getElementById("obsolete_string").hidden = true;
    switch (hiddenType.value) {
        case "Nextcloud":
            document.getElementById("logo").src = "images/nextcloud-logo.svg";
            break;

        case "ownCloud":
            document.getElementById("logo").src = "images/owncloud-logo.svg";
            break;

        case "Unsupported":
            document.getElementById("logo").hidden = true;
            document.getElementById("obsolete_string").hidden = false;
            break;

        default:
            document.getElementById("logo").src = "images/management.png";
            break;
    }
}

/**
 * Load stored account data into form
 */
async function fillFormWithStoredData() {
    await ncc.load();

    all_inputs
        .forEach(inp => {
            if (inp.type === "checkbox") {
                inp.checked = !!ncc[inp.id];
            } else if (ncc[inp.id]) {
                inp.value = ncc[inp.id];
            }
        });

    downloadPassword.disabled = !useDlPassword.checked;
    downloadPassword.required = useDlPassword.checked;

    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = useExpiry.checked;
}
//#endregion

//#region Helpers
/**
 * Fetch the cloud version and show error messages if that leads to problems
 * @param {string} url The base url of the cloud
 */
async function getCloudVersion(url) {
    let ct = { type: null, versionstring: null, };
    popup.clear();
    try {
        ct = await CloudConnection.fetchCloudVersion(url);
    } catch (error) {
        switch (error.name) {
            case "SyntaxError":
                // Could not parse JSON
                popup.error("no_cloud");
                break;
            case "TypeError":
                // fetch had a severe problem
                popup.error("cloud_unreachable");
                break;
            default:
                popup.error(0);
                break;
        }
    }
    hiddenVersion.value = ct.versionstring;
    hiddenType.value = ct.type;
    hiddenProductname.value = ct.productname;
    if (ct.type === "Unsupported") {
        popup.warn("unsupported_cloud");
    }
}

/**
 * Set the busy cursor and deactivate all inputs
 * @returns {object} An object that contains the disabled state of all inputs, indexed by id
 */
async function lookBusy() {
    provider_management.classList.add('busy');
    saveButton.disabled = resetButton.disabled = true;
    let states = {};
    all_inputs
        .forEach(element => {
            states[element.id] = element.disabled;
            element.disabled = true;
        });
    return states;
}

/**
 * Hide the busy cursor and reactivate all fields that were active
 * @param {Object} states The previous states of the elements as returned by lookBusy
 */
async function stopLookingBusy(states) {
    for (const elementId in states) {
        document.getElementById(elementId).disabled = states[elementId];
    }
    provider_management.classList.remove('busy');
}

//#endregion