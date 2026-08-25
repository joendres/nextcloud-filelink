// Copyright (C) 2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CLOUDTYPE } from "./cloudcapabilities.js";
import { convertToDataUrl } from "./imageconvert.js";

/** 
*
* Fetches the favicon URL from the given base URL. If the favicon link is not
* found or the base URL is unreachable, it returns the file location of the
* default logo. The other return value property is a data url containing the
* favicon or the path to the default logo
*
* @param {CloudCapabilities} capabilities 
* @param {string} baseUrl The base URL of the cloud server
* @returns {Promise<{cloud_logo_url: string, service_icon:string}>} The URL of the favicon and its content as a data url
*/
async function getFaviconUrl(capabilities, baseUrl) {
    let cloud_logo_url = capabilities.theme_icon_url;

    if (cloud_logo_url) {
        const service_icon = await fetchAndConvert(cloud_logo_url, capabilities.theme_color);
        if (service_icon) {
            return { cloud_logo_url, service_icon };
        }
    }

    // Then try to get a favicon URL from the cloud
    cloud_logo_url = await parseFaviconFromStartpage(baseUrl);
    if (cloud_logo_url) {
        const service_icon = await fetchAndConvert(cloud_logo_url, capabilities.theme_color);
        if (service_icon) {
            return { cloud_logo_url, service_icon };
        }
    }

    // If that didn't work, use the local Icon
    cloud_logo_url = getCloudTypeIcon(capabilities.cloud_type);
    return { cloud_logo_url, service_icon: cloud_logo_url };
}

async function fetchAndConvert(url, theme_color) {
    try {
        // Semgrep-False-Positive: The URL originates from the trusted cloud
        // or from the cloud's own start page; it is not an arbitrary
        // user-supplied destination. The fetched resource is subsequently
        // checked to be convertible to an image data URL.
        const response = await fetch(url); // nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
        if (response.ok) {
            // This rejects if conversion fails
            return await convertToDataUrl(await response.blob(), theme_color);
        }
    } catch (_) { /* Ignore errors, we will return undefined anyway */ }
    // either the fetch or the conversion failed, we don't have a data url
    return undefined;
}

/**
 * 
 * @param {string} baseUrl 
 * @returns string?
 */
async function parseFaviconFromStartpage(baseUrl) {
    try {
        // Omit credentials to always fetch the favicon of the login page.
        const response = await fetch(baseUrl, { credentials: "omit" });
        if (!response.ok) {
            return null;
        }
        const html = await response.text();
        const doc = (new DOMParser()).parseFromString(html, 'text/html');
        // Try to find the favicon link in the document
        // Prefer the apple touch icon because it is usually bigger and gives a better quality when scaled
        let link = doc.querySelector('link[rel*="apple-touch-icon"]');
        if (!(link?.href)) {
            // Fall back to the old style favicon
            link = doc.querySelector('link[rel*="icon"]');
        }
        if (link?.href) {
            /*  oCIS checks for browser compatability and sends a page without
            a favicon if it deems the browser incompatible. oCIS also
            redirects access to the favicon url ./static/favicon.ico to the
            incompatible browser page. So we live with it as Thunderbird would
            not be able to fetch the favicon in that case anyway */

            // link.href is an absolute URL with the origin of the internal
            // URL of the Addon (moz-extension://...) We need to fix it to a
            // URL on the server which is in response.url
            //
            // If instead it is an absolute url on a different server the
            // following will produce a broken url. We leave it at that
            // because it will not be downloadable and that will be checked in
            // the next step.
            const linkHrefUrl = new URL(link.href);

            const responseUrl = new URL(response.url);
            responseUrl.pathname = linkHrefUrl.pathname;

            // This might be the wrong URL if 
            // 1. the icon url does not start with a slash, and
            // 2. login page is not at the root of the server
            //
            // But we assume that Nextcloud and ownCloud alway use icon urls that
            // start with a slash (Assumption is the mother of all fuckups)

            return responseUrl.href;
        }
    } catch (_) {
        // Ignore all problems, just return the default logo
    }
    return null;
}

/**
 * 
 * @param {string} cloud_type 
 * @returns string
 */
function getCloudTypeIcon(cloud_type) {
    return {
        [CLOUDTYPE.NEXTCLOUD]: "/icons/nextcloud-logo.svg",
        [CLOUDTYPE.OWNCLOUD]: "/icons/owncloud-logo.svg",
        [CLOUDTYPE.INFINITESCALE]: "/icons/ocis-app-icon.png",
        [CLOUDTYPE.OPENCLOUD]: "/icons/opencloud-logo.svg",
        [CLOUDTYPE.OTHER]: "/icons/icon48.png",
    }[cloud_type] || "/icons/icon48.png";
}

export { getFaviconUrl };