// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Popup } from "./popup/popup.js";

/**
 * @param {CloudCapabilities} capabilities 
 */
function applyCloudConstraints(capabilities) {
    checkEnforcedExpiry(capabilities);
    checkEnforcedDLPassword(capabilities);
    checkEnforcedPreviewLinks(capabilities);
}

/**
 * If a maximum expiry is enforced, make it mandatory by changing the inputs
 * @param {CloudCapabilities} capabilities 
 */
function checkEnforcedExpiry(capabilities) {
    const expiryDays = document.getElementById("expiryDays");
    const useExpiry = document.getElementById("useExpiry");

    if (capabilities.expiry_max_days) {
        // If an expiry shorter than the cloud's maximum was active before,
        // leave it as is. Otherwise activate expiry and set it to the maximum
        if (!useExpiry.checked || expiryDays.value > capabilities.expiry_max_days) {
            expiryDays.value = capabilities.expiry_max_days;
            Popup.warn("expiry_too_long");
            document.getElementById("advanced_options").open = true;
        }
        expiryDays.max = capabilities.expiry_max_days;
        useExpiry.disabled = true;
        useExpiry.checked = true;
    } else {
        // This is correct while only serverUrl, username, password and
        // storageFolder may be locked in enterprise policies
        expiryDays.removeAttribute('max');
        useExpiry.disabled = false;
    }
    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = useExpiry.checked;
}

/**
 * If password is enforced, make it mandatory by changing the inputs
 * @param {CloudCapabilities} capabilities 
 */
function checkEnforcedDLPassword(capabilities) {
    // This is correct while only serverUrl, username, password and
    // storageFolder may be locked in enterprise policies

    const useNoDlPassword = document.getElementById("useNoDlPassword")
    // Only allow to choose "No Password" it it is not enforced by the cloud
    useNoDlPassword.disabled = capabilities.enforce_password;
    // ... but it was selected
    if (capabilities.enforce_password && useNoDlPassword.checked) {
        const oneDLPassword = document.getElementById("oneDLPassword");
        const useDlPassword = document.getElementById("useDlPassword");
        const advanced_options = document.getElementById("advanced_options");

        useDlPassword.checked = true;
        useNoDlPassword.checked = false;
        Popup.error('password_enforced');
        oneDLPassword.checked = true;
        advanced_options.open = true;
    }
}

/**
 * ownCloud Infinite Scale and OpenCloud don't support the /download suffix
 * on shared links, force file info links.
* @param {CloudCapabilities} capabilities 
 */
function checkEnforcedPreviewLinks(capabilities) {
    if (capabilities.no_download_links) {
        const noAutoDownload = document.getElementById("noAutoDownload");

        if (!noAutoDownload.checked) {
            Popup.warn('ocis_no_download_links');
        }
        noAutoDownload.checked = true;
        noAutoDownload.disabled = true;
    }
}

export { applyCloudConstraints }