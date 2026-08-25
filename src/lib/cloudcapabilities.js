// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { capabilitiesStorageKey } from "./storagelayout.js";

// Use constants for cloud type instead of magic strings. If we change this to
// something other (other strings, other type) we have to upgrade the accounts
// in background.js.
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
    [CLOUDTYPE.NEXTCLOUD]: "32",
    [CLOUDTYPE.OWNCLOUD]: "10.0.10",
    [CLOUDTYPE.INFINITESCALE]: "5",
    [CLOUDTYPE.OPENCLOUD]: "4",
}

/**
 * Parse the API information on cloud's capabilities 
 */
class CloudCapabilities {
    /** @type {string} */
    #accountId;

    /** @type {Object<string,*>} */
    #version = {};
    /** @type {Object<string,*>} */
    #capabilities = {};
    /** @type {string} */
    #cloud_logo_url = "../icons/icon48.png";
    /** @type {string} */
    #service_icon = "../icons/icon48.png";

    constructor(accountId) {
        this.#accountId = accountId;
    }

    /**
     *
     * @param {string} accountId The id of the account as supplied by Thunderbird
     */
    static get(accountId) {
        const cc = new CloudCapabilities(accountId);
        return cc.#load();
    }

    static remove(accountId) {
        return browser.storage.session.remove(capabilitiesStorageKey(accountId));
    }

    /**
     * 
     * @param {{version?:Object<string,string|number|boolean>, 
     *   capabilities?:Object<string,*>,
     *   cloud_logo_url?:string,
     *   service_icon?:string,
     * }} data The capabilities object as returned by the cloud and parsed
     */
    updateAndStore(data) {
        this.#version = data.version ?? this.#version;
        this.#capabilities = data.capabilities ?? this.#capabilities;
        this.#service_icon = data.service_icon ?? this.#service_icon;
        this.#cloud_logo_url = data.cloud_logo_url ?? this.#cloud_logo_url;
        return this.#store();
    }

    /**
     * 
     * @returns {Promise<CloudCapabilities>}
     */
    async #load() {
        const storageKey = capabilitiesStorageKey(this.#accountId);
        const data = (await browser.storage.session.get(storageKey))[storageKey];
        if (data) {
            this.#version = data.version ?? this.#version;
            this.#capabilities = data.capabilities ?? this.#capabilities;
            this.#cloud_logo_url = data.cloud_logo_url ?? this.#cloud_logo_url;
            this.#service_icon = data.service_icon ?? this.#service_icon;
        }
        return this;
    }

    /**
     * 
     */
    #store() {
        const storageKey = capabilitiesStorageKey(this.#accountId);
        return browser.storage.session.set({
            [storageKey]: {
                version: this.#version,
                capabilities: this.#capabilities,
                cloud_logo_url: this.#cloud_logo_url,
                service_icon: this.#service_icon,
            }
        });
    }

    /**
     * Get the string representing the version of the cloud or an empty string
     * if there is none.
     *
     * @returns {string} 
     */
    get cloud_versionstring() {
        // Use the best version from capabilities. Modern versions put it
        // into productversion, but older don't have that key.
        return this.#version.productversion || this.#version.string || "";
    }

    /**
    * Determine the type of cloud on the server
    *
    * @returns A string describing the type of cloud
    */
    get cloud_type() {
        if ("theming" in this.#capabilities && this.#capabilities.core?.status === undefined) {
            // Filerun has theming && the ownCloud like copy of status
            return CLOUDTYPE.NEXTCLOUD;
        }
        const productname = this.#capabilities.core?.status?.productname;
        if (productname) {
            // OpenCloud and oCIS also have versionstring !=== productversion.
            // But so far we don't have to use that as the productname is quite
            // revealing.
            switch (productname) {
                case "Infinite Scale":
                    return CLOUDTYPE.INFINITESCALE;
                case "OpenCloud":
                    return CLOUDTYPE.OPENCLOUD;
            }
            if ([10, 11].includes(Number(this.#version.major))) {
                return CLOUDTYPE.OWNCLOUD;
            }
        }
        return CLOUDTYPE.OTHER;
    }

    /**
     * The name of the cloud instance, or "*cloud" if no name could be found
     * 
     * @returns {string}
     */
    get cloud_productname() {
        if (this.#capabilities.theming?.name) {
            return this.#capabilities.theming.name;
        }
        if (this.#capabilities.core?.status?.productname) {
            return this.#capabilities.core.status.productname;
        }
        return "*cloud";
    }

    /**
     * Find out if the cloud version is obsolete
     * @returns {boolean} true, if the detected cloud version is greater or equal to the minimal supported version, or if none was detected
     */
    get supported_version() {
        const versionstring = this.cloud_versionstring;
        if (!versionstring) {
            // 'this' is new and has no data yet, don't call it "unsupported"
            return true;
        }

        const type = this.cloud_type;
        if (minmalVersion[type]) {
            return parseSemverToNumber(versionstring) >=
                parseSemverToNumber(minmalVersion[type]);
        }
        return false;

        /**
         * Combines the parts of a SemVer into one number so it can be
         * compared with regular operators. This works for 1- or 2-digit minor
         * and patch. Returns NaN (which is not >= anything) on errors. 
         *
         * @param {string} version 
         * @returns {number}
         */
        function parseSemverToNumber(version) {
            if (typeof version !== 'string') { return NaN; }
            const parts = version.trim().split('.').slice(0, 3);
            // Exclude things like "1..2"
            if (parts.some(e => e === '')) { return NaN; }

            while (parts.length < 3) { parts.push(0); }

            return parts.reduce((a, e) => a * 1000 + Number(e), 0);
        }
    }

    /**
     * The the logo of the cloud, possibly themed
     */
    get cloud_logo_url() {
        return this.#cloud_logo_url;
    }

    /**
     * The data url representing or the local path of the favicon of the cloud
     * to include in the message
     */
    get service_icon() {
        return this.#service_icon;
    }

    /**
     * Is public file sharing enabled in this cloud? Defaults to true to
     * include newly created accounts that do not yet have retrieved
     * capabilities
     */
    get public_shares_enabled() {
        const enabled = this.#capabilities.files_sharing?.public?.enabled;
        // The default is true to handle new accounts that do not yet have
        // retrieved capabilities 
        return enabled === undefined ? true : !!enabled;
    }

    /**
     * Is a download password required for this cloud?
     */
    get enforce_password() {
        const sharingPasswordSettings = this.#capabilities.files_sharing?.public?.password;
        if (this.public_shares_enabled && sharingPasswordSettings) {
            if (sharingPasswordSettings.enforced_for) {
                // ownCloud
                return !!sharingPasswordSettings.enforced_for?.read_only;
            }
            // Nextcloud    
            return !!sharingPasswordSettings.enforced;

        }
        return false;
    }

    /**
     * The maximum expiry time for shares in days, undefined if the cloud does
     * not enforce a limit
     */
    get expiry_max_days() {
        if (this.public_shares_enabled
            && this.#capabilities?.files_sharing?.public?.expire_date?.enforced) {

            const expiryDays = Number(this.#capabilities.files_sharing.public.expire_date.days);
            if (expiryDays > 0) {
                return expiryDays;
            }
        }
        return undefined;
    }

    /**
     * Does the cloud only support preview links, not download links?
     */
    get no_download_links() {
        return this.#isOcisFork();
    }

    /**
     *  Does its WebDAV implementation return the entire quota instead of the
     *  available space in quota-available-bytes on PROPFIND?
     */
    get has_dav_quota_bug() {
        return this.#isOcisFork();
    }

    /**
     * Nextcloud offers an API endpoint to validate a password.
     */
    get password_validate_url() {
        try {
            // Check if the URL is present and contains a valid absolute href
            // We don't check if it is on the same server, because it comes
            // from the server after login. If the server is evil this is not
            // the point where it becomes a problem.
            const url = new URL(this.#capabilities.password_policy?.api?.validate);
            return url.href;
        } catch (_) {
            return undefined;
        }
    }

    /**
     * Nextcloud offers an API endpoint to generate a password that satisfies the password policy
     */
    get password_generate_url() {
        try {
            // Check if the URL is present and contains a valid absolute href
            // We don't check if it is on the same server, because it comes
            // from the server after login. If the server is evil this is not
            // the point where it becomes a problem.
            const url = new URL(this.#capabilities.password_policy?.api?.generate);
            return url.href;
        } catch (_) {
            return undefined;
        }
    }

    /**
     * The favicon of logo url from theming if there is one
     * @type {string|undefined}
     */
    get theme_icon_url() {
        // We don't check if it is on the same server, because it is only used
        // to retreive an image.
        try {
            const url = new URL(this.#capabilities?.theming?.favicon ?? this.#capabilities?.theming?.logo);
            return url.origin + url.pathname;
        } catch (_) {
            return undefined;
        }
    }

    /**
     * The theme color from theming if it is a valid CSS color
     * @type {string|undefined}
     */
    get theme_color() {
        // Use an option because its constructor gives compact code
        const style = (new Option()).style;
        style.color = this.#capabilities?.theming?.color;
        return style.color || undefined;
    }

    /**
     * Get the timezone of the server (per user setting in Nextcloud)
     * @returns {string|undefined}
     */
    get user_timezone() {
        return this.#capabilities.core?.user?.timezone;
    }

    /**
     * Is it oCIS or similar?
     */
    #isOcisFork() {
        const type = this.cloud_type;
        return CLOUDTYPE.OPENCLOUD === type
            || CLOUDTYPE.INFINITESCALE === type;
    }
}

export { CloudCapabilities, CLOUDTYPE };