// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Display cloud type (as a logo), version, name and make the logo clickable
 * to access the cloud
 * @param {CloudCapabilities} capabilities 
 * @param {string} serverUrl 
 */
function showVersion(capabilities, serverUrl) {
    const logo = document.getElementById("logo");
    logo.style.background = capabilities.theme_color;
    logo.src = capabilities.cloud_logo_url;
    document.getElementById("cloud_version").textContent = capabilities.cloud_versionstring;
    document.getElementById("provider_name").textContent = capabilities.cloud_productname;
    document.getElementById("obsolete_string").hidden = capabilities.supported_version;

    document.getElementById("service_url").href = serverUrl;
}

export { showVersion }