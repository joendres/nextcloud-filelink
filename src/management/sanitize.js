// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Static class that holds the functions to sanitize and normalize
 * user-supplied configuration values before they are stored or used in API
 * calls.
 */
class Sanitize {
    /**
     * Sanitize the serverUrl and find the baseURL if the user pasted the URL
     * from their browser.
     *
     * @param {string} value The raw value from the form
     */
    static serverUrl(value) {
        // URL path parts that mark the start of the internal call route.
        // Everything before that is considered part of the base path.
        // Heuristically taken from Nextcloud 30.0.4, ownCloud 10.15.0,
        // oCIS Web UI 11.0.6
        const known_path_parts = [
            'account', // oCIS and OpenCloud
            'apps', // *cloud after login
            'files',  // oCIS and OpenCloud
            'ocis-app-tokens', // oCIS: default URL for App Token App
            'login', // *cloud before login
            'settings', // *cloud
            'signin', // oCIS and OpenCloud before login
            'text-editor', // oCIS and OpenCloud
        ];

        // As the input field is validated against a URL RE, this cannot fail(TM)
        const url = new URL(value.trim());

        // Split into parts and remove double slashes
        const pathparts = url.pathname.split('/').filter(e => !!e);

        // Find the first indicator for the end of the base URL
        const index = pathparts.findIndex(pp => known_path_parts.includes(pp) || pp.match(/\.php$/));

        let shortpath = index < 0 ? pathparts.join(('/')) : pathparts.slice(0, index).join('/');
        shortpath += shortpath.length > 0 ? '/' : '';

        return url.origin + '/' + shortpath;
    }

    /**
     * Sanitize the username
     * @param {string} value The raw value from the form
     */
    static username(value) {
        return value.trim();
    }

    /**
     * Sanitize the password
     * @param {string} value The raw value from the form
     */
    static password(value) {
        return value.trim();
    }

    /**
     * Sanitize the cloud storage path and make sure it's absolute
     * @param {string} value The raw value from the form
     */

    static storageFolder(value) {
        // Remove extra slashes from folder path and ake sure it starts with a slash
        return "/" + value.split('/').filter(e => "" !== e).join('/');
    }

    /**
     * Sanitize the username
     * @param {string} value The raw value from the form
     */
    static downloadPassword(value) {
        return value.trim();
    }
}

export { Sanitize };