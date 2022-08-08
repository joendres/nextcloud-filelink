import { CloudAPI } from "./cloudapi.js";

//#region  Configurable options and useful constants
// @todo move this to headerhandler?
const ncMinimalVersion = 23;
const ocMinimalVersion = 10 * 10000 + 0 * 100 + 10;
//#endregion

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 * (API and DAV)
 */
export class CloudAccount {
    //#region Constructors, load & store
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
    //#endregion

    //#region Event Handlers
    /**
     * Clean up if an account is deleted
     */
    async deleteAccount() {
        browser.storage.local.remove(this._accountId);
    }
    //#endregion

    //#region Public Methods
    /**
     * Gets free/used space from web service and sets the parameters in
     * Thunderbirds cloudFileAccount
     * @returns {number} The amount of free space available to the user in bytes or -1
     */
    async updateFreeSpaceInfo() {
        this.free = -1;
        this.total = -1;

        const data = await CloudAPI.getUserInfo(this);
        if (data && data.quota) {
            if ("free" in data.quota) {
                const free = parseInt(data.quota.free);
                this.free = free >= 0 && free <= Number.MAX_SAFE_INTEGER ? free : -1;
            }
            if ("total" in data.quota) {
                const total = parseInt(data.quota.total);
                this.total = total >= 0 && total <= Number.MAX_SAFE_INTEGER ? total : -1;
            } else if ("used" in data.quota && this.free >= 0) {
                const used = parseInt(data.quota.used);
                this.total = used >= 0 && used <= Number.MAX_SAFE_INTEGER ? used + this.free : -1;
            }
        }

        this.store();
    }

    /**
     * Get useful information from the server and store it as properties
     */
    async updateCapabilities() {
        const data = await CloudAPI.getCapabilities(this);

        if (!data._failed && data.capabilities) {
            // Don't test data.capabilities.files_sharing.api_enabled because the next line contains it all
            // Is public sharing enabled?
            this.public_shares_enabled = !!data.capabilities.files_sharing &&
                !!data.capabilities.files_sharing.public && !!data.capabilities.files_sharing.public.enabled;
            if (this.public_shares_enabled) {
                // Remember if a download password is required
                this.enforce_password = false;
                if (data.capabilities.files_sharing.public.password) {
                    if (data.capabilities.files_sharing.public.password.enforced_for &&
                        'boolean' === typeof data.capabilities.files_sharing.public.password.enforced_for.read_only) {
                        // ownCloud
                        this.enforce_password = !!data.capabilities.files_sharing.public.password.enforced_for.read_only;
                    } else {
                        //Nextcloud                        
                        this.enforce_password = !!data.capabilities.files_sharing.public.password.enforced;
                    }
                }
                // Remember maximum expiry set on server
                delete this.expiry_max_days;
                if (data.capabilities.files_sharing.public.expire_date &&
                    data.capabilities.files_sharing.public.expire_date.enforced &&
                    isFinite(data.capabilities.files_sharing.public.expire_date.days) &&
                    data.capabilities.files_sharing.public.expire_date.days > 0) {
                    this.expiry_max_days = parseInt(data.capabilities.files_sharing.public.expire_date.days);
                }
            }

            // Remember password policy urls if they are present (AFAIK only in NC 17+)
            delete this.password_validate_url;
            delete this._password_generate_url;
            if (data.capabilities.password_policy && data.capabilities.password_policy.api) {
                try {
                    const u = new URL(data.capabilities.password_policy.api.validate);
                    if (u.host === (new URL(this.serverUrl)).host) {
                        this.password_validate_url = u.origin + u.pathname;
                    }
                } catch (_) { /* Error just means there is no url */ }
                try {
                    const u = new URL(data.capabilities.password_policy.api.generate);
                    if (u.host === (new URL(this.serverUrl)).host) {
                        this._password_generate_url = u.origin + u.pathname;
                    }
                } catch (_) { /* Error just means there is no url */ }
            }

            // Take version from capabilities
            this.cloud_productname = "*cloud";
            this.cloud_versionstring = data.version.string;
            // Take name & type from capabilities
            if (data.capabilities.theming && data.capabilities.theming.name) {
                this.cloud_productname = data.capabilities.theming.name;
                this.cloud_type = "Nextcloud";
                this.cloud_supported = data.version.major >= ncMinimalVersion;
            } else if (data.capabilities.core.status && data.capabilities.core.status.productname) {
                this.cloud_productname = data.capabilities.core.status.productname;
                this.cloud_type = "ownCloud";
                this.cloud_supported = parseInt(data.version.major) * 10000 +
                    parseInt(data.version.minor) * 100 +
                    parseInt(data.version.micro) >= ocMinimalVersion;
            } else if (data.version.major >= ncMinimalVersion) {
                this.cloud_productname = "Nextcloud";
                this.cloud_type = "Nextcloud";
                this.cloud_supported = true;
            } else {
                this.cloud_type = "Unsupported";
                this.cloud_supported = false;
            }
        }
        return data;
    }

    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if it is usable
     */
    async updateConfigured() {
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
     * @returns An object w/ the data from the response or error information
     */
    async updateUserId() {
        const data = await CloudAPI.getUser(this);
        if (data.id) {
            // Nextcloud and ownCloud use this RE to check usernames created manually
            if (data.id.match(/^[-a-zA-Z0-9 _.@']+$/)) {
                this.userId = data.id;
            } else {
                /* The userid contains characters that ownCloud and Nextcloud
                don't like. This might happen with external ids as eg supplied
                via SAML. One reals world example: Guest users in an ADFS tenant
                have #EXT# in their userid. Those IDs seem to work over the API
                but (at least) break the web interface. */
                this.userId = encodeURIComponent(data.id);
            }
        }
        return data;
    }

    /**
     * Update the state of the CloudAccount object with relevant information
     * available from the cloud eg free space, capabilities, userid
     */
    async updateFromCloud() {
        let answer = await this.updateUserId();
        this.laststatus = null;
        if (answer._failed && this.username) {
            // If login failed, we might be using an app token which requires a lowercase user name
            const oldname = this.username;
            this.username = this.username.toLowerCase();
            answer = await this.updateUserId();
            if (answer._failed) {
                // Nope, it's not the case, restore username
                this.username = oldname;
            }
        }
        if (answer._failed) {
            this.laststatus = answer.status;
        } else {
            await Promise.all([this.updateFreeSpaceInfo(), this.updateCapabilities(),]);
        }
    }

    /**
     * Fetches a new app password from the Nextcloud web service and
     * replaces the current password with it
     * @return {boolean} Was a new app password set?
     */
    async convertToApppassword() {
        const data = await CloudAPI.getAppPassword(this);
        if (data && data.apppassword) {
            // Test if the apppassword really works with the given username
            const oldpassword = this.password;
            this.password = data.apppassword;
            const r = await CloudAPI.getUser(this);
            if (r._failed || r.status >= 900) {
                this.password = oldpassword;
            } else {
                return true;
            }
        }
        return false;
    }

    /**
     * Validate the download password using the validation web service url from capabilities.
     * If there is no such url, only check if the password is empty
     * @returns {*} An object containing either the validation status (and reason for failure) or error information if web service failed
     */
    async validateDLPassword() {
        if (this.password_validate_url) {
            const data = await CloudAPI.validateDownloadPassword(this, this.downloadPassword);
            data.passed = !!data.passed;
            return data;
        } else {
            return {
                // Probably not a Nextcloud instance, accept any password
                passed: true,

            };
        }
    }
    //#endregion
}
