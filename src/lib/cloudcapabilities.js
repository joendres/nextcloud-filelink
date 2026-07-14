// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

// Use constants for cloud type instead of magic strings.
// If we change this to something other (other strings, other type) we have to
// upgrade the accounts in background.js.
const CLOUDTYPE = Object.freeze({
    NEXTCLOUD: "Nextcloud",
    OWNCLOUD: "ownCloud",
    INFINITESCALE: "oCIS",
    OPENCLOUD: "OpenCloud",
    OTHER: "Unsupported",
});

// Minimal supported versions of the four cloud types
const minmalVersion =
{
    [CLOUDTYPE.NEXTCLOUD]: [32, 0, 0],
    [CLOUDTYPE.OWNCLOUD]: [10, 0, 10],
    [CLOUDTYPE.INFINITESCALE]: [5, 0, 0],
    [CLOUDTYPE.OPENCLOUD]: [3, 0, 0],
}

/**
 * Parse the API information on cloud's capabilities 
 */
class CloudCapabilities {
    constructor(data) {
        this.version = data.version || {};
        this.capabilities = data.capabilities || {};
    }

    /**
     * Get the string representing the version of the cloud or an empty string
     * if there is none.
     *
     * @returns {string} 
     */
    versionstring() {
        // Use the best version from capabilities. Modern versions put it
        // into productversion, but older don't have that key.
        return this.version.productversion || this.version.string || "";
    }

    /**
    * Determine the type of cloud on the server based on its answer to the
    * capabilities API call
    *
    * @returns A string describing the type of cloud
    */
    guessCloudType() {
        // The version might not be a good criterion when oCIS and OpenCloud
        // get more updates
        if (parseInt(this.version.major) >= 11 || this.capabilities.theming && this.capabilities.theming.name) {
            return CLOUDTYPE.NEXTCLOUD;
        }
        if (this.capabilities.core
            && this.capabilities.core.status
            && this.capabilities.core.status.productname) {
            // OpenCloud and oCIS also have versionstring !=== productversion.
            // But so far we don't have to use that as the productname is quite
            // revealing.
            if (this.capabilities.core.status.productname === "Infinite Scale") {
                return CLOUDTYPE.INFINITESCALE;
            }
            if (this.capabilities.core.status.productname === "OpenCloud") {
                return CLOUDTYPE.OPENCLOUD;
            }
            if (parseInt(this.version.major) === 10) {
                return CLOUDTYPE.OWNCLOUD;
            }
        }
        return CLOUDTYPE.OTHER;
    }

    /**
     * The name of the cloud instance, might be set by theming
     * 
     * @returns {string|undefined}
     */
    getInstanceName() {
        if (this.capabilities.theming && this.capabilities.theming.name) {
            return this.capabilities.theming.name;
        }
        if (this.capabilities.core.status && this.capabilities.core.status.productname) {
            return this.capabilities.core.status.productname;
        }
        return undefined;
    }

    /**
     * Find out if the cloud version is supported
     */
    supportedVersion() {
        const versionstring = this.versionstring();
        if (!versionstring) {
            return false;
        }

        const type = this.guessCloudType();

        if (minmalVersion[type]) {
            return makeVersionComparable(versionstring.split(".")) >=
                makeVersionComparable(minmalVersion[type]);
        }
        return false;

        /**
         * Combines the parts of a SemVer into one number so it can be
         * compared with regular operators. This works for 1- or 2-digit minor
         * and patch. Returns NaN (which is not >= anything) on errors. 
         *
         * @param {*}  
         * @returns 
         */
        function makeVersionComparable([major, minor, patch]) {
            return parseInt(major) * 10000 +
                parseInt(minor) * 100 +
                parseInt(patch);
        }
    }

    /**
     * Is public file sharing enabled in this cloud?
     */
    publicSharesEnabled() {
        // Don't test data.capabilities.files_sharing.api_enabled because the next line contains it all
        return !!this.capabilities.files_sharing
            && !!this.capabilities.files_sharing.public
            && !!this.capabilities.files_sharing.public.enabled;
    }

    /**
     * Is a download password required for this cloud?
     */
    passwordRequired() {
        if (this.publicSharesEnabled()
            && this.capabilities.files_sharing.public.password) {

            if (this.capabilities.files_sharing.public.password.enforced_for) {
                // ownCloud
                return !!this.capabilities.files_sharing.public.password.enforced_for.read_only;
            } else {
                // Nextcloud    
                return !!this.capabilities.files_sharing.public.password.enforced;
            }
        }
        return false;
    }

    /**
     * The maximum expiry time for shares in days,
     * undefined if the cloud does not enforce a limit
     */
    expiryMaxDays() {
        if (this.publicSharesEnabled()
            && this.capabilities.files_sharing.public.expire_date
            && this.capabilities.files_sharing.public.expire_date.enforced) {

            const expiryDays = parseInt(this.capabilities.files_sharing.public.expire_date.days);
            if (expiryDays > 0) {
                return expiryDays;
            }
        }
        return undefined;
    }

    /**
     * Nextcloud offers an API endpoint to validate a password.
     */
    passwordValidateUrl(serverUrl) {
        if (this.capabilities.password_policy && this.capabilities.password_policy.api) {
            try {
                const u = new URL(this.capabilities.password_policy.api.validate);
                if (u.host === (new URL(serverUrl)).host) {
                    return u.origin + u.pathname;
                }
            } catch (_) { /* Error just means there is no url */ }
        }
        return undefined;
    }

    /**
     * Nextcloud offers an API endpoint to generate a password that satisfies the password policy
     */
    passwordGenerateUrl(serverUrl) {
        if (this.capabilities.password_policy && this.capabilities.password_policy.api) {
            try {
                const u = new URL(this.capabilities.password_policy.api.generate);
                if (u.host === (new URL(serverUrl)).host) {
                    return u.origin + u.pathname;
                }
            } catch (_) { /* Error just means there is no url */ }
        }
        return undefined;
    }

    /**
     * Is it oCIS or similar?
     */
    isOcisFork() {
        const type = this.guessCloudType();
        return CLOUDTYPE.OPENCLOUD === type
            || CLOUDTYPE.INFINITESCALE === type;
    }
}

/* exported CloudCapabilities */
/* exported CLOUDTYPE */