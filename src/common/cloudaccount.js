import { CloudAPI } from "./cloudapi.js";

// @todo move this to headerhandler?
const ncMinimalVersion = 23;
const ocMinimalVersion = 10 * 10000 + 0 * 100 + 10;

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 * (API and DAV)
 */
export class CloudAccount {
    /**
     * @param {string} accountId Whatever Thunderbird uses as an account identifier
     */
    constructor(accountId) {
        this._accountId = accountId;

        this.laststatus = null;
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
        return this;
    }

    /**
     * Clean up if an account is deleted
     */
    async deleteAccount() {
        browser.storage.local.remove(this._accountId);
    }

    /**
     * Gets quota from web service and stores the free/total values
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
        this.store();

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
        const { capabilities, version, } = await CloudAPI.getCapabilities(this);

        if (capabilities) {
            // Don't test capabilities.files_sharing.api_enabled because the next line contains it all
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
            /** @todo Move this to headerhandler as the version is only needed there */
            /** @todo check if version is available */
            this.cloud_productname = "*cloud";
            this.cloud_versionstring = version.string;
            // Take name & type from capabilities
            if (capabilities.theming && capabilities.theming.name) {
                this.cloud_productname = capabilities.theming.name;
                this.cloud_type = "Nextcloud";
                this.cloud_supported = version.major >= ncMinimalVersion;
            } else if (capabilities.core.status && capabilities.core.status.productname) {
                this.cloud_productname = capabilities.core.status.productname;
                this.cloud_type = "ownCloud";
                this.cloud_supported = parseInt(version.major) * 10000 +
                    parseInt(version.minor) * 100 +
                    parseInt(version.micro) >= ocMinimalVersion;
            } else if (version.major >= ncMinimalVersion) {
                this.cloud_productname = "Nextcloud";
                this.cloud_type = "Nextcloud";
                this.cloud_supported = true;
            } else {
                this.cloud_type = "Unsupported";
                this.cloud_supported = false;
            }
        }

        /**
         * @returns {boolean} Is public file sharing enabled on the server?
         */
        function publicSharingEnabled() {
            return !!capabilities.files_sharing &&
                !!capabilities.files_sharing.public &&
                !!capabilities.files_sharing.public.enabled;
        }

        /**
         * @returns {boolean} Does the server enforce a download password?
         */
        function passwordEnforced() {
            let r = false;
            if (capabilities.files_sharing.public.password) {
                if (capabilities.files_sharing.public.password.enforced_for &&
                    'boolean' === typeof capabilities.files_sharing.public.password.enforced_for.read_only) {
                    // ownCloud
                    r = !!capabilities.files_sharing.public.password.enforced_for.read_only;
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
    }


    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if it is usable
     */
    async updateConfigured() {
        // jshint maxcomplexity:16
        // The function only seems complex due to the many conditions
        browser.cloudFile.updateAccount(this._accountId, {
            configured:
                this.public_shares_enabled !== false &&
                !!this.serverUrl &&
                !!this.username &&
                !!this.userId &&
                !!this.password &&
                !!this.storageFolder &&
                // If download password is enforced, a password option is active
                !(this.enforce_password && !this.useGeneratedDlPassword && !this.oneDLPassword) &&
                // If "one password" is selected, it has to be present 
                !(this.oneDLPassword && !this.downloadPassword) &&
                !(this.useExpiry && !this.expiryDays) &&
                !(!!this.expiry_max_days && this.useExpiry && this.expiry_max_days < this.expiryDays),
        });
    }

    /**
     * Get the UserID from the cloud and store it in the objects's internals
     * @returns {string?} The UserID or null on error
     */
    async updateUserId() {
        const userId = await CloudAPI.getUserId(this);
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
                this.userId = encodeURIComponent(userId);
            }
        }
        return userId;
    }

    /**
     * Update the state of the CloudAccount object with relevant information
     * available from the cloud eg free space, capabilities, userid
     */
    async updateFromCloud() {
        let answer = await this.updateUserId();
        this.laststatus = null;
        if (!answer && this.username) {
            // If login failed, we might be using an app token which requires a lowercase user name
            const oldname = this.username;
            this.username = this.username.toLowerCase();
            answer = await this.updateUserId();
            if (!answer) {
                // Nope, it's not the case, restore username
                this.username = oldname;
            }
        }
        if (!answer) {
            /** @todo replace */
            // this.laststatus = answer.status;
        } else {
            await Promise.all([this.updateFreeSpaceInfo(), this.updateCapabilities(),]);
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
            // No, doesn't work, restore the old password
            if (!userId) {
                this.password = oldpassword;
            }
        }
    }

    /**
     * Validate the download password using the validation web service url from capabilities.
     * If there is no such url, only check if the password is empty
     * @returns {Promise<bool?>} Does the password stand the check, null on error
     */
    async validateDLPassword() {
        if (this.password_validate_url) {
            return await CloudAPI.validateDownloadPassword(this, this.downloadPassword);
        } else {
            return !!this.downloadPassword;
        }
    }
}
