// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Class to hold and store login data and settings of an account
 */
class Account {
    /** @type {string} */
    accountId;

    // Login data
    /** Base URL of the cloud server
     * @type {string} */
    serverUrl;
    /** Username for login at the cloud server
     * @type {string} */
    username;
    /** Password for login at the cloud server
     * @type {string} */
    password;

    /** Used in the DAV path name, might differ from username
     * @type {string} */
    userId;

    /** Folder on the cloud server where uploaded files are stored
     * @type {string} */
    storageFolder;

    /** Whether share links should expire after a number of days
     * @type {boolean} */
    useExpiry;
    /** Number of days after which share links expire, if useExpiry is true
     * @type {number} */
    expiryDays;

    /**  @type {boolean} */
    useDlPassword;
    /** @type {boolean} */
    useNoDlPassword;
    /** @type {boolean} */
    useGeneratedDlPassword;
    /** @type {boolean} */
    oneDLPassword;
    /** @type {string} */
    downloadPassword;

    /** Create Preview links instead of download links
     * @type {boolean} */
    noAutoDownload;

    /**  List of settings that are preconfigured by enterprise policies and
     * are not user editable
     * @type {string[]} */
    lockedSettings = [];

    /**
     * @param {string} accountId The account identifier supplied by Thunderbird
     */
    constructor(accountId) {
        this.accountId = accountId;
    }

    /**
     * Get an account, stored or new
     * @param {string} accountId The id of the account to get
     * @returns {Promise<Account>} A Promise that resolves to the Account,
     * filled with the previously stored values or with undefined properties
     * if no settings were stored
     */
    static get(accountId) {
        const account = new Account(accountId);
        return account.#load();
    }

    /**
     * Set default values for fields that may not be empty, then store the
     * account.
     */
    setDefaultsAndStore() {
        const defaults = {
            storageFolder: '/Mail-attachments',
            expiryDays: 14,
            // Nothing to do for the boolean fields, because they are designed
            // to be "falsy" by default.
        };

        for (const key in defaults) {
            this[key] ??= defaults[key];
        }
        return this.#store();
    }

    /**
     * Store the current values of all public properties in the local browser storage
     */
    #store() {
        return browser.storage.local.set({ [this.accountId]: this, });
    }

    /**
     * Load account state from configuration storage into this instance
     * @returns {Promise<Account>} This instance, filled with stored values (or unchanged if nothing was stored yet)
     */
    async #load() {
        const id = this.accountId;
        const accountInfo = await browser.storage.local.get(id);
        if (accountInfo?.[id]) {
            for (const key in accountInfo[id]) {
                // Ignore properties not already present
                if (!Object.hasOwn(this, key)) { continue; }
                this[key] = accountInfo[id][key];
            }
        }
        return this;
    }

    /**
     * Update the account in place with the property values from the settings object and store it
     * 
     * @param {Object<string,*>} settings 
     */
    updateAndStore(settings) {
        for (const key in settings) {
            // Ignore properties not already present
            if (!Object.hasOwn(this, key)) { continue; }
            this[key] = settings[key];
        }
        return this.#store();
    }

    /**
     * Delete an account
     * @param {string} accountId The id of the account to delete
     */
    static remove(accountId) {
        return browser.storage.local.remove(accountId);
    }

    /**
     * Check if the account has settings necessary for login. Without these
     * testing the connection does not make sense. This basically reproduces
     * the validity check of the management form.
     * @returns {boolean} Is the necessary login data present?
     */
    hasLoginData() {
        return /^https?:\/\/.+/.test(this.serverUrl) && // serverUrl is present and matches a URL
            !!this.username && // username is a not empty string
            !!this.password; // password is a not empty string
    }

    /**
     * Get the display name of this account
     * @returns {Promise<string|undefined>} The account's name, or `undefined` if the account doesn't exist.
     */
    async name() {
        return (await messenger.cloudFile.getAccount(this.accountId))?.name;
    }

    /**
     * Get or set whether this account is usable, i.e. has valid enough
     * settings and capabilities to actually create shares (see
     * updateConfigured() for the exact criteria).
     *
     * Acts as a getter when called without arguments (or with `undefined`):
     * reads the current state. Acts as a setter when called with a boolean:
     * persists the given value and returns it unchanged.
     * @param {boolean} [configured] Omit to read the current state; pass a
     * boolean to set it.
     * @returns {Promise<boolean>} The (possibly newly set) usable state.
     */
    async usable(configured) {
        if (undefined === configured) {
            // getter
            return ((await messenger.cloudFile.getAccount(this.accountId))?.configured);
        }
        // setter
        await messenger.cloudFile.updateAccount(this.accountId, { configured, });
        return configured;
    }

    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if it is usable
     * @param {CloudCapabilities} capabilities 
     * @returns {Promise<messenger.cloudFile.CloudFileAccount|undefined>} The CloudFileAccount that has been updated
     */
    /* eslint-disable-next-line complexity -- This has to check many conditions but is not actually complex */
    updateConfigured(capabilities) {
        // First check the criteria that do not need the capabilities
        const configured =
            // Are all the necessary settings present?
            this.hasLoginData() &&
            !!this.userId &&
            typeof this.storageFolder === "string" && this.storageFolder.length > 0 &&
            // If a download password should be used, is one available?
            (!this.useDlPassword || this.useGeneratedDlPassword || (typeof this.downloadPassword === "string" && this.downloadPassword.length > 0)) &&
            // If links should expire, is a timespan configured?
            (!this.useExpiry || this.expiryDays > 0) &&
            // Is sharing by link enabled in the cloud?
            capabilities.public_shares_enabled === true &&
            // If the server requires a download password, is one configured locally?
            (!capabilities.enforce_password || this.useDlPassword) &&
            // If the server requires expiry of shares, is it configured locally?
            (!capabilities.expiry_max_days > 0 || this.useExpiry && capabilities.expiry_max_days >= this.expiryDays) &&
            // If the server does not support download links, is the option set correctly?
            (!capabilities.no_download_links || this.noAutoDownload);

        return messenger.cloudFile.updateAccount(this.accountId, { configured, });
    }
}

export { Account }
