// Copyright (C) 2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

/** 
*
* Fetches the favicon URL from the given base URL.
* If the favicon link is not found or the base URL is unreachable, it returns null.
* 
* @param {string} baseUrl The base URL of the cloud server
* @returns {string|null} The URL of the favicon or null if not found
*/
async function getFaviconUrl(baseUrl) {
    try {
        // Omit credentials to always fetch the favicon of the login page.
        const response = await fetch(baseUrl, { credentials: "omit" });
        if (!response.ok) {
            return null;
        }
        const html = await response.text();
        const doc = (new DOMParser()).parseFromString(html, 'text/html');
        // Try to find the favicon link in the document
        const link = doc.querySelector('link[rel*="icon"]');
        if (!link || !link.href) {
            return null;
            /*  oCIS checks for browser compatability and sends a page without
            a favicon if it deems the browser incompatible. oCIS also
            redirects access to the favicon url ./static/favicon.ico to the
            incompatible browser page. So we live with it as Thunderbird would
            not be able to fetch the favicon in that case anyway */
        }

        // link.href is an absolute URL with the origin of the internal URL of the Addon (moz-extension://...)
        // We need to fix it to a URL on the server which is in response.url
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
    } catch (_) {
        return null; // If fetching the base URL or parsing the returned html fails, return null
    }
}

/* exported getFaviconUrl */