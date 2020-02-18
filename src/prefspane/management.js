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

const hiddenVersion = document.querySelector("#versionstring");
const hiddenType = document.querySelector("#cloudtype");
const hiddenProductname = document.querySelector("#productname");

const accountForm = document.querySelector("#accountForm");
const serverUrl = document.querySelector("#serverUrl");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const storageFolder = document.querySelector("#storageFolder");
const useDlPassword = document.querySelector("#useDlPassword");
const downloadPassword = document.querySelector("#downloadPassword");
const useExpiry = document.querySelector("#useExpiry");
const expiryDays = document.querySelector("#expiryDays");
const saveButton = document.querySelector("#saveButton");
const resetButton = document.querySelector("#resetButton");

(() => {
    // Fill in form fields
    setStoredData()
        .then(fillHeader);

    // Add localized strings
    document.querySelectorAll("[data-message]")
        .forEach(element => {
            element.innerHTML = browser.i18n.getMessage(element.dataset.message);
        });

    // Make form active
    document.querySelectorAll("input")
        .forEach(inp => {
            inp.oninput = activateButtons;
        });
})();

function fillHeader() {
    browser.cloudFile.getAccount(accountId).then(
        theAccount => {
            // Update the free space gauge
            let free = theAccount.spaceRemaining;
            const used = theAccount.spaceUsed;
            if (free >= 0 && used >= 0) {
                const full = (free + used) / (1024.0 * 1024.0 * 1024.0); // Convert bytes to gigabytes
                free /= 1024.0 * 1024.0 * 1024.0;
                document.querySelector("#freespacelabel").textContent = browser.i18n.getMessage("freespace", [
                    free > 100 ? free.toFixed() : free.toPrecision(2),
                    full > 100 ? full.toFixed() : full.toPrecision(2),]);
                const meter = document.querySelector("#freespace");
                meter.max = full;
                meter.value = free;
                meter.low = full / 10;
                document.querySelector("#freespaceGauge").style.visibility = "visible";
            }
        });
    document.querySelector("#cloud_version").textContent = hiddenVersion.value;
    document.querySelector("#service_url").href = serverUrl.value;
    if (hiddenProductname.value && hiddenProductname.value !== "undefined") {
        document.querySelector("#provider-name").textContent = hiddenProductname.value;
    } else {
        document.querySelector("#provider-name").textContent = "*cloud";
    }

    switch (hiddenType.value) {
        case "Nextcloud":
            document.querySelector("#logo").src = "nextcloud-logo.svg";
            document.querySelector("#logo").hidden = false;
            document.querySelector("#obsolete_string").hidden = true;
            break;

        case "ownCloud":
            document.querySelector("#logo").src = "owncloud-logo.svg";
            document.querySelector("#logo").hidden = false;
            document.querySelector("#obsolete_string").hidden = true;
            break;

        case "Unsupported":
            document.querySelector("#logo").hidden = true;
            document.querySelector("#obsolete_string").hidden = false;
            break;

        default:
            document.querySelector("#logo").src = "management.png";
            document.querySelector("#logo").hidden = false;
            document.querySelector("#obsolete_string").hidden = true;
            break;
    }
}

/**
 * Load stored account data into form
 */
async function setStoredData() {
    await ncc.load();

    document.querySelectorAll("input")
        .forEach(inp => {
            if (inp.type === "checkbox") {
                inp.checked = Boolean(ncc[inp.id]);
            } else if (ncc[inp.id]) {
                inp.value = ncc[inp.id];
            }
        });

    downloadPassword.disabled = !useDlPassword.checked;
    downloadPassword.required = useDlPassword.checked;

    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = useExpiry.checked;
}

/** 
 * Handler for input event of all inputs: Only activate the buttons, if the form
 * input is OK
 */
function activateButtons() {
    if (accountForm.checkValidity()) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
    resetButton.disabled = false;
}

function linkDisabledToCheckbox(element, checkbox) {
    checkbox.addEventListener("click", async () => {
        element.disabled = !checkbox.checked;
        element.required = !element.disabled;
    });
}

/**
 *  enable/disable download password field according to checkbox state
 */
linkDisabledToCheckbox(downloadPassword, useDlPassword);

linkDisabledToCheckbox(expiryDays, useExpiry);

/** 
 * Handler for Cancel button, restores saved values
 */
resetButton.onclick = async () => {
    setStoredData();
    resetButton.disabled = saveButton.disabled = true;
};

/** Handler for Save button */
saveButton.onclick = async () => {
    // deactivate the form while handling it
    const provider_management = document.querySelector("body");
    provider_management.classList.add('busy');
    saveButton.disabled = resetButton.disabled = true;
    let states = {};
    document.querySelectorAll("input")
        .forEach(element => {
            states[element.id] = element.disabled;
            element.disabled = true;
        });

    // Sanitize input
    document.querySelectorAll("input")
        .forEach(element => {
            element.value = element.value.trim();
        });
    serverUrl.value = serverUrl.value.replace(/\/+$/, "");

    storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');

    // If user typed new password, username or URL the token is likely not valid any more
    const needsNewToken = password.value !== ncc.password ||
        username.value !== ncc.username ||
        serverUrl.value !== ncc.serverUrl;

    // Copy data into a connection object
    document.querySelectorAll("input")
        .forEach(inp => {
            if (inp.type === "checkbox") {
                ncc[inp.id] = inp.checked;
            } else {
                ncc[inp.id] = inp.value;
            }
        });

    // Update header
    ncc.updateFreeSpaceInfo();
    fillHeader();

    // Try to convert the password into App Token if necessary
    if (needsNewToken) {
        password.value = await ncc.convertToApppassword();
    }

    // Store account data and update configured state
    ncc.store()
        .then(ncc.updateConfigured());

    // Re-activate form
    for (const elementId in states) {
        document.getElementById(elementId).disabled = states[elementId];
    }
    provider_management.classList.remove('busy');
};

serverUrl.onchange = async () => {
    serverUrl.value = serverUrl.value.trim();
    let ct = { type: null, versionstring: null, };
    popup.clear();
    try {
        ct = await CloudConnection.fetchCloudVersion(serverUrl.value);
    } catch (error) {
        switch (error.name) {
            case "SyntaxError":
                popup.error("no_cloud");
                break;
            case "TypeError":
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
    if (ct.type==="Unsupported") {
        popup.warn("unsupported_cloud");
    }

    fillHeader();
};