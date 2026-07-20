// Copyright (C) 2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CLOUDTYPE } from "./cloudcapabilities.js";

/** 
*
* Fetches the favicon URL from the given base URL. If the favicon link is not
* found or the base URL is unreachable, it returns the file location of the
* default logo.
*
* @param {string} baseUrl The base URL of the cloud server
* @param {string} cloud_type The type of the cloud to select the default logo
* if necessary
* @returns {string} The URL of the favicon
*/
async function getFaviconUrl(baseUrl, cloud_type) {
    // First try to get a favicon URL from the cloud
    let faviconUrl = await getCloudIcon(baseUrl);
    // If that didn't work, use the local Icon
    faviconUrl ??= getCloudTypeIcon(cloud_type);
    return faviconUrl;
}

/**
 * 
 * @param {string} baseUrl 
 * @returns string?
 */
async function getCloudIcon(baseUrl) {
    try {
        // Omit credentials to always fetch the favicon of the login page.
        const response = await fetch(baseUrl, { credentials: "omit" });
        if (!response.ok) {
            throw new Error("Goto defaults");
        }
        const html = await response.text();
        const doc = (new DOMParser()).parseFromString(html, 'text/html');
        // Try to find the favicon link in the document
        const link = doc.querySelector('link[rel*="icon"]');
        if (link?.href) {
            /*  oCIS checks for browser compatability and sends a page without
            a favicon if it deems the browser incompatible. oCIS also
            redirects access to the favicon url ./static/favicon.ico to the
            incompatible browser page. So we live with it as Thunderbird would
            not be able to fetch the favicon in that case anyway */

            // link.href is an absolute URL with the origin of the internal URL of
            // the Addon (moz-extension://...) We need to fix it to a URL on the
            // server which is in response.url
            const linkHrefUrl = new URL(link.href);

            const faviconUrl = new URL(response.url);
            faviconUrl.pathname = linkHrefUrl.pathname;
            faviconUrl.search = linkHrefUrl.search;
            faviconUrl.hash = linkHrefUrl.hash;

            // This might be the wrong URL if 
            // 1. the icon url does not start with a slash, and
            // 2. login page is not at the root of the server
            //
            // But we assume that Nextcloud and ownCloud alway use icon urls that
            // start with a slash (Assumption is the mother of all fuckups)

            return faviconUrl.href;
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

export { getFaviconUrl, getCloudTypeIcon };