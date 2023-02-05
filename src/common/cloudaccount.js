// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Utils } from "../common/utils.js";
import { CloudAPI } from "./cloudapi.js";

const ncMinimalVersion = 23;
const ocMinimalVersion = 10 * 10000 + 0 * 100 + 10;

// Used to initialize a new account upon creation in TB
const defaults = {
    storageFolder: "/Mail-attachments",
    expiryDays: 7,
    useNoDlPassword: true,
};

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 */
export class CloudAccount {
    /**
     * @param {string} accountId Whatever Thunderbird uses as an account identifier
     */
    constructor(accountId) {
        this._accountId = accountId;
    }

    /**
     * Set necessary properties to their default values
     */
    setDefaults() {
        Object.assign(this, defaults);
    }

    /**
     * Store the current values of all properties in the local browser storage
     */
    async store() {
        browser.storage.local.set({ [this._accountId]: this, });
    }

    /**
    * Load account state from configuration storage
    */
    async load() {
        const id = this._accountId;
        const accountInfo = await browser.storage.local.get(id);
        for (const key in accountInfo[id]) {
            this[key] = accountInfo[id][key];
        }
    }

    /**
     * Clean up if an account is deleted
     */
    async delete() {
        browser.storage.local.remove(this._accountId);
    }

    /**
     * Gets quota from web service and stores the free/total values
     * @returns {Promise<number>} The amount of free space in bytes
     */
    async updateFreeSpaceInfo() {
        let { free, total, used, } = await CloudAPI.getQuota(this);

        if (!inRange(free)) {
            total = free = -1;
        } else if (!inRange(total)) {
            if (inRange(used)) {
                total = used + free;
            } else {
                total = free = -1;
            }
        } else if (total < free) {
            total = free = -1;
        }

        this.free = free;
        this.total = total;
        /** @todo does this make sense? */
        this.store();
        return free;

        /**
         * Check, if the given number is a safe positive integer
         * @param {number} x 
         */
        function inRange(x) {
            return Number.isSafeInteger(x) && x >= 0;
        }
    }

    /**
     * Get useful information from the server and store it as properties
     */
    async updateCapabilities() {
        const { capabilities, version, } = await CloudAPI.getCapabilitiesAndVersion(this);

        if (capabilities) {
            // Is public sharing enabled?
            this.public_shares_enabled = publicSharingEnabled();
            if (this.public_shares_enabled) {
                // Remember if a download password is required
                this.enforce_password = passwordEnforced();
                // Remember maximum expiry set on server
                this.expiry_max_days = expiryMaxDays();
                /** @todo also remember enforced */

                // Remember password policy urls if they are present (AFAIK only in NC 17+)
                this.password_validate_url = validatePasswordUrl(this.serverUrl);
                this.password_generate_url = generatePasswordUrl(this.serverUrl);
            }


            // Take version from capabilities
            this.cloud_versionstring = version && version.string ? version.string : "";
            this.cloud_productname = cloudProductName();
            this.cloud_type = guessCloudType();
            this.cloud_supported = cloudSupported(this.cloud_type);
        }

        /**
         * Check if public file sharing is enabled on the server
         */
        function publicSharingEnabled() {
            return !!capabilities.files_sharing &&
                !!capabilities.files_sharing.api_enabled &&
                !!capabilities.files_sharing.public &&
                !!capabilities.files_sharing.public.enabled;
        }

        /**
         * Check if the server enforces a download password
         */
        function passwordEnforced() {
            let r = false;
            if (capabilities.files_sharing.public.password) {
                if (capabilities.files_sharing.public.password.enforced_for &&
                    'boolean' === typeof capabilities.files_sharing.public.password.enforced_for.read_only) {
                    // ownCloud
                    r = capabilities.files_sharing.public.password.enforced_for.read_only;
                } else {
                    //Nextcloud                        
                    r = !!capabilities.files_sharing.public.password.enforced;
                }
            }
            return r;
        }

        /**
         * Extract the maximum number of days for expiry from server settings
         * @returns {number?} The maximum number of days or null if none configured
         */
        function expiryMaxDays() {
            if (capabilities.files_sharing.public.expire_date &&
                /** @todo might make sense to remember this separately */
                capabilities.files_sharing.public.expire_date.enforced &&
                isFinite(capabilities.files_sharing.public.expire_date.days) &&
                capabilities.files_sharing.public.expire_date.days > 0) {

                return parseInt(capabilities.files_sharing.public.expire_date.days);
            }
            return null;
        }

        /**
         * Extracts an url that may be used to validate a (download) password
         * against the configured restrictions
         * @param {string} serverUrl The server url of this account
         * @returns {string?} The url or null if the server does not offer this service
         */
        function validatePasswordUrl(serverUrl) {
            if (capabilities.password_policy && capabilities.password_policy.api) {
                try {
                    const u = new URL(capabilities.password_policy.api.validate);
                    if (u.host === (new URL(serverUrl)).host) {
                        return u.origin + u.pathname;
                    }
                } catch (_) { /* Error just means there is no url */ }
            }
            return null;
        }

        /**
         * Extracts an url that may be used to get a (download) password
         * from the server that meets the configured rules
         * @param {string} serverUrl The server url of this account
         * @returns {string?} The url or null if the server does not offer this service
         */
        function generatePasswordUrl(serverUrl) {
            if (capabilities.password_policy && capabilities.password_policy.api) {
                try {
                    const u = new URL(capabilities.password_policy.api.generate);
                    if (u.host === (new URL(serverUrl)).host) {
                        return u.origin + u.pathname;
                    }
                } catch (_) { /* Error just means there is no url */ }
            }
            return null;
        }

        /**
         * @returns {string} The name of the cloud instance as configured there
         */
        function cloudProductName() {
            if (capabilities.theming && capabilities.theming.name) {
                return capabilities.theming.name;
            } else if (capabilities.core.status && capabilities.core.status.productname) {
                return capabilities.core.status.productname;
            }
            return "*cloud";
        }

        /**
         * Try to find out if the server runs Nextcloud or ownCloud or something else
         */
        function guessCloudType() {
            if (capabilities.core.status) {
                return "ownCloud";
            } else if (capabilities.theming || version.major >= ncMinimalVersion) {
                return "Nextcloud";
            }
            return "Unsupported";
        }

        /**
         * Check if the type and version of the cloud are supported
         * @param {string} cloud_type The cloud type as guessed before
         */
        function cloudSupported(cloud_type) {
            switch (cloud_type) {
                case "Nextcloud":
                    return version.major >= ncMinimalVersion;
                case "ownCloud":
                    return parseInt(version.major) * 10000 +
                        parseInt(version.minor) * 100 +
                        parseInt(version.micro) >= ocMinimalVersion;
                default:
                    return false;
            }
        }
    }

    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if it is usable
     */
    updateConfigured() {
        // jshint maxcomplexity:18
        // The function only seems complex due to the many conditions
        return browser.cloudFile.updateAccount(this._accountId, {
            configured:
                !!this.public_shares_enabled &&
                !!this.serverUrl &&
                !!this.username &&
                !!this.userId &&
                !!this.password &&
                !!this.storageFolder &&
                // If download password is enforced, a password option is active
                !(this.enforce_password && !this.useGeneratedDlPassword && !this.oneDLPassword) &&
                // If "one password" is selected, it has to be present 
                (!this.oneDLPassword || !!this.downloadPassword) &&
                (!this.useExpiry || !!this.expiryDays) &&
                (!this.expiry_max_days || !this.useExpiry || this.expiry_max_days >= this.expiryDays) &&
                (!this.expiry_enforced || this.useExpiry),
        });
    }

    /**
     * Get the UserID from the cloud and store it in the objects's internals
     * @returns {Promise<string?>} The UserID or null on error
     */
    async updateUserId() {
        let userId = await CloudAPI.getUserId(this);
        if (userId) {
            // Nextcloud and ownCloud use this RE to check usernames created manually
            if (userId.match(/^[-a-zA-Z0-9 _.@']+$/)) {
                this.userId = userId;
            } else {
                /* The userid contains characters that ownCloud and Nextcloud
                don't like. This might happen with external ids as eg supplied
                via SAML. One reals world example: Guest users in an ADFS tenant
                have #EXT# in their userid. Those IDs seem to work over the API
                but (at least) break the web interface. */
                this.userId = userId = Utils.encodeRFC3986(userId);
            }
        }
        return userId;
    }

    /**
     * Update the state of the CloudAccount object with relevant information
     * available from the cloud eg free space, capabilities, userid
     */
    async updateFromCloud() {
        let userId = await this.updateUserId();
        if (!userId && this.username) {
            // If login failed, we might be using an app token which requires a lowercase user name
            const oldname = this.username;
            this.username = this.username.toLowerCase();
            userId = await this.updateUserId();
            if (!userId) {
                // Nope, it's not the case, restore username
                this.username = oldname;
            }
        }
        if (userId) {
            this.updateCapabilities();
            this.updateFreeSpaceInfo();
        }
    }

    /**
     * Fetches a new app password from the Nextcloud web service and
     * replaces the current password with it
     */
    async convertToApppassword() {
        const apppassword = await CloudAPI.getAppPassword(this);
        if (apppassword) {
            // Test if the apppassword really works with the given username,
            // because with some external auth providers it might not
            const oldpassword = this.password;
            this.password = apppassword;
            const userId = await CloudAPI.getUserId(this);
            if (!userId) {
                // No, doesn't work, restore the old password
                /** @todo Does it make sense to check with lowercase username too? */
                this.password = oldpassword;
            }
        }
    }

    /**
     * Validate the download password using the validation web service url from capabilities.
     * If there is no such url, only check if the password is empty.
     * @returns {Promise<boolean>}
     */
    async validateDLPassword() {
        let valid = await CloudAPI.validateDownloadPassword(this, this.downloadPassword);
        return null === valid ? !!this.downloadPassword : valid;
    }
}
