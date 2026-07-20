// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { UploadStatus } from "./uploadstatus.js";
import { DAVClient } from "./davclient.js";
import { CloudCapabilities } from "./cloudcapabilities.js";
import { getCloudTypeIcon, getFaviconUrl } from "./getFaviconUrl.js";
import { generatePassword } from "./generatePassword.js";
import { encodepath } from "./utils.js";
// It's the default export
import punycode from "../vendor/punycode.es6.js";

// API endpoints
const apiUrlBase = "ocs/v1.php";
const apiUrlUserInfo = "/cloud/users/";
const apiUrlUserID = "/cloud/user";
const apiUrlShares = "/apps/files_sharing/api/v1/shares";
const apiUrlGetAppToken = "/core/getapppassword";
const apiUrlCapabilities = "/cloud/capabilities";
const davUrlBase = "remote.php/dav/files/";

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 * (API and DAV)
 */
class CloudConnection {
    /**
     * @param {*} accountId Whatever Thunderbird uses as an account identifier
     */
    constructor(accountId) {
        this._accountId = accountId;

        const manifest = browser.runtime.getManifest();
        this._apiHeaders = {
            "OCS-APIREQUEST": "true",
            "User-Agent": "Filelink for *cloud/" + manifest.version,
        };
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
    }

    /**
     * Set the default values on the CloudConnection if the relevant fields
     * are empty
     */
    setDefaults() {
        const defaults = {
            storageFolder: '/Mail-attachments',
            expiryDays: 14,
        }
        for (const key in defaults) {
            this[key] ??= defaults[key];
        }
    }

    /**
     * Upload a single file
     *
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName w/o path
     * @param {File} fileObject the local file as a File object
     */
    async uploadFile(uploadId, fileName, fileObject) {
        await UploadStatus.create(uploadId, fileName);
        await UploadStatus.preparing(uploadId);

        const uploader = new DAVClient(
            this.serverUrl, this.username, this.password, davUrlBase + this.userId, this.storageFolder);

        const response = await uploader.uploadFile(uploadId, fileName, fileObject);

        if (response.aborted) {
            return response;
        } else if (response.ok) {
            await UploadStatus.sharing(uploadId);

            this.updateFreeSpaceInfo();
            let url = this._cleanUrl(await this._getShareLink(fileName, uploadId));
            if (url) {
                // Add additional information introduced in TB 98
                const templateInfo = await this.#fillTemplate();
                if (!(await UploadStatus.hasPassword(uploadId))) {
                    UploadStatus.remove(uploadId);
                }
                return {
                    url,
                    templateInfo,
                    aborted: false,
                };
            }
        }

        UploadStatus.fail(uploadId);
        throw new Error("Upload failed.");
    }

    /**
     * Set information used to fill the text template in the message, currently
     * only the fields download_password_protected and download_expiry_date
     * @returns {messenger.cloudFile.CloudFileTemplateInfo} The relevant information for the current upload
     */
    async #fillTemplate() {
        const templateInfo = {
            download_password_protected: this.useDlPassword,
        };

        // Workaround:
        // Thunderbird >=96 and <135.0 allow external URLs and download the icon
        // Thunderbird >=135 only allow local files, not even dataURIs
        const browserinfo = await browser.runtime.getBrowserInfo();
        const version = browserinfo.version.split('.');
        if (version[0] < 135) {
            templateInfo.service_icon = this.cloud_logo_url;
        } else {
            templateInfo.service_icon = getCloudTypeIcon(this.cloud_type);
        }

        if (this.useExpiry) {
            templateInfo.download_expiry_date = {
                timestamp: Date.now() + this.expiryDays * 24 * 60 * 60 * 1000,
            };
        }

        // If the account has no name configured, use the product_name.
        // Otherwise the account name is used automatically
        const cloudFileAccount = await messenger.cloudFile.getAccount(this._accountId);
        if (!cloudFileAccount.name || cloudFileAccount.name === "*cloud") {
            templateInfo.service_name = this.cloud_productname;
        }

        return templateInfo;
    }

    /**
     * Clean up if an account is deleted
     */
    async deleteAccount() {
        browser.storage.local.remove(this._accountId);
    }


    /**
     * Get free space from web service and save it in the CloudConnection object
     */
    async updateFreeSpaceInfo() {
        this.spaceRemaining = -1;

        if (this.has_dav_quota_bug)
            // oCIS does not return the available quota on PROPFIND, but the
            // entire quota: https://github.com/owncloud/ocis/issues/8197, so
            // use user quota instead
            this.spaceRemaining = await this.getUserQuota();
        else
            this.spaceRemaining = await this.getDAVQuota();

        this.store();
        // Don't tell Thunderbird about the free space
        // (cloudFile.updateAccount()) because it would not start larger
        // uploads and hence break the chance to re-use an existing upload
    }

    /**
     * Use WebDAV PROPFIND to get free space
     */
    async getDAVQuota() {
        const dc = new DAVClient(this.serverUrl, this.username, this.password, davUrlBase + this.userId, this.storageFolder);

        let folder = this.storageFolder;
        let quotaInfo = await dc.getQuotaAvailableBytes(folder);
        // If the folder doesn't exist (yet), got up the tree
        while (quotaInfo.status === 404 && folder !== '/') {
            folder = folder.split('/').slice(0, -1).join('/') || '/';
            quotaInfo = await dc.getQuotaAvailableBytes(folder);
        };
        return quotaInfo.spaceRemaining;
    }

    /**
     * Use user quota to determine free space
     */
    async getUserQuota() {
        let spaceRemaining = -1;

        const data = await this._doApiCall(apiUrlUserInfo + this.userId);
        if (data && data.quota && "free" in data.quota) {
            const free = parseInt(data.quota.free);
            spaceRemaining = free >= 0 && free <= Number.MAX_SAFE_INTEGER ? free : -1;
        }
        return spaceRemaining;
    }

    /**
     * Delete all the properties that are read from the server's capabilities to clean out old values
     */
    forgetCapabilities() {
        [
            '_password_validate_url',
            '_password_generate_url',
            'public_shares_enabled',
            'enforce_password',
            'expiry_max_days',
            'cloud_versionstring',
            'cloud_productname',
            'cloud_type',
            'cloud_supported',
            'has_dav_quota_bug',
            'no_download_links',
        ]
            .forEach(p => delete this[p]);
    }

    /**
     * Get useful information from the server and store it as properties
     */
    async updateCapabilities() {
        const data = await this._doApiCall(apiUrlCapabilities);

        if (!data._failed) {

            const capabilities = new CloudCapabilities(data);

            // Is public sharing enabled?
            this.public_shares_enabled = capabilities.publicSharesEnabled();
            if (this.public_shares_enabled) {
                // Remember if a download password is required
                this.enforce_password = capabilities.passwordRequired();
                // Remember maximum expiry set on server
                this.expiry_max_days = capabilities.expiryMaxDays();
            }

            // Remember password policy urls if they are present (AFAIK only in NC 17+)
            this._password_validate_url = capabilities.passwordValidateUrl(this.serverUrl);
            this._password_generate_url = capabilities.passwordGenerateUrl(this.serverUrl);

            this.cloud_versionstring = capabilities.versionstring();
            // Deduce type from capabilities
            this.cloud_type = capabilities.guessCloudType();
            // Find out, if it's a supported version
            this.cloud_supported = capabilities.supportedVersion();

            // Does the cloud support download links?
            this.no_download_links = capabilities.isOcisFork();
            // Does its WebDAV implementation return the wrong quota on PROPFIND?
            this.has_dav_quota_bug = capabilities.isOcisFork();

            // Get the name of the instance
            this.cloud_productname = capabilities.getInstanceName();
        }

        // Get the faviconUrl from the server
        this.cloud_logo_url = await getFaviconUrl(this.serverUrl, this.cloud_type);

        this.store();
    }

    /**
     * Check if the account has settings necessary for login. Without these
     * testing the connection does not make sense. This basically reproduces
     * the validity check of the management form.
     */
    hasLoginData() {
        return (
            // serverUrl is present and matches an url
            typeof this.serverUrl === 'string' &&
            /^https?:\/\/.+/.test(this.serverUrl) &&
            // username is a not empty string
            typeof this.username === 'string' && this.username.length > 0 &&
            // password is a not empty string
            typeof this.password === 'string' && this.password.length > 0
        );
    }

    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if it is usable
     */
    async updateConfigured() {
        messenger.cloudFile.updateAccount(this._accountId, {
            configured:
                // Are all the necessary settings present?
                this.hasLoginData() &&
                this.userId !== undefined &&
                typeof this.storageFolder === "string" && this.storageFolder.length > 0 &&
                // Is sharing by link enabled in the cloud?
                this.public_shares_enabled === true &&
                // If the server requires a download password, is one configures locally?
                !(this.enforce_password && !this.useDlPassword) &&
                // If a download password should be used, is one available?
                (!this.useDlPassword || this.useGeneratedDlPassword || typeof this.downloadPassword === "string") &&
                // If links should expire, is a timespan configured?
                !(this.useExpiry && !this.expiryDays) &&
                // If the server requires expiry of shares, is it configured locally?
                !(this.expiry_max_days > 0 && this.useExpiry && this.expiry_max_days < this.expiryDays),
        });
    }

    /**
     * Get the UserID from the cloud and store it in the objects's internals
     * @returns An object w/ the data from the response or error information
     */
    async updateUserId() {
        const data = await this._doApiCall(apiUrlUserID);
        if (data.id) {
            // Nextcloud and ownCloud use this RE to check usernames created manually
            if (data.id.match(/^[a-zA-Z0-9 _.@\-']+$/)) {
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
     * Fetches a new app password from the Nextcloud/ownCloud web service and
     * replaces the current password with it
     */
    async convertToApppassword() {
        const data = await this._doApiCall(apiUrlGetAppToken);
        if (data && data.apppassword) {
            // Test if the apppassword really works with the given username
            const oldpassword = this.password;
            this.password = data.apppassword;
            const r = await this._doApiCall(apiUrlUserID);
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
        if (this._password_validate_url) {
            const data = this._doApiCall(this._password_validate_url, 'POST',
                { "Content-Type": "application/x-www-form-urlencoded", },
                'password=' + encodeURIComponent(this.downloadPassword));
            data.passed = !!data.passed;
            return data;
        } else if (!this.downloadPassword) {
            return { passed: false, reason: 'Password must not be empty.', };
        } else {
            return {
                passed: true,
                _failed: true,
                status: 'not_nc',
                statusText: 'Cloud does not validate passwords, probably not a Nextcloud instance.',
            };
        }
    }
    /**
     * Generate a download password using the NC web service if its present or a local generator otherwise
     * @returns {string} A most probably valid password
     */
    async generateDLPassword() {
        let pw;
        if (this._password_generate_url) {
            const data = await this._doApiCall(this._password_generate_url);
            if (data.password) {
                // This needs no sanitization because it is only displayed, using textContent
                pw = data.password;
            }
        }
        /* If we generate a password locally, the generation via web service didn't work. In that case
        validation also doesn't work, so the locally generateed password cannot be validated. */
        return pw || generatePassword(16);
    }

    /**
     * Get a share link for the file, reusing an existing one with the same
     * parameters
     * @param {string} fileName The name of the file to share
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {string} The share link as returned by the OCS API
     */
    async _getShareLink(fileName, uploadId) {
        const path_to_share = encodepath(this.storageFolder + "/" + fileName);
        const expireDate = this.useExpiry ? daysFromTodayIso(this.expiryDays) : undefined;

        // It's not possible to retreive an display the password for an existing share
        if (!this.useDlPassword) {
            //  Check if the file is already shared ...
            const existingShare = await this._findExistingShare(path_to_share, expireDate);
            if (existingShare && existingShare.url) {
                return existingShare.url;
            }
        }
        return this._makeNewShare(path_to_share, expireDate, uploadId);

        /**
         * Adds the given number of days to the current date and returns an ISO sting of
         * that date
         * @param {number} days Number of days to add
         */
        function daysFromTodayIso(days) {
            const d = new Date();
            d.setDate(d.getDate() + parseInt(days));
            return d.toISOString().slice(0, 10);
        }
    }

    /**
     * Check if the file is already shared with the same parameters
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @returns {*} The existing share or undefined
     */
    async _findExistingShare(path_to_share, expireDate) {
        const shareinfo = await this._doApiCall(apiUrlShares + "?path=" + path_to_share);

        // If we the ApiCall fails, the result is not an Array. So make sure, we can call find() before we do
        // Check for every existing share, if it meets our requirements:
        return !shareinfo.find ? undefined : shareinfo.find(share =>
            // It's a public share ...
            (share.share_type === 3) &&
            /* If a password is set, share_with is not empty in both cloud
            flavors. Since we have no chance to retreive the share password, we
            use this to ignore shares with passwords. But Nextcloud might "fix"
            this, so we also check for password to make sure we are still fine
            if that happens.*/
            // ... and it has no password ...
            !share.share_with && !share.password &&
            // ... and the same expiration date
            (
                (!this.useExpiry && share.expiration === null) ||
                (this.useExpiry && share.expiration !== null && share.expiration.startsWith(expireDate))
            ));
    }

    /**
     * Share the file
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {string} The new share url or null
     */
    async _makeNewShare(path_to_share, expireDate, uploadId) {
        let shareFormData = "path=" + path_to_share;
        shareFormData += "&shareType=3"; // 3 = public share

        let downloadPassword = this.downloadPassword;
        if (this.useDlPassword) {
            if (this.useGeneratedDlPassword) {
                downloadPassword = await this.generateDLPassword();
            }
            shareFormData += "&password=" + encodeURIComponent(downloadPassword);
        }

        if (this.useExpiry) {
            shareFormData += "&expireDate=" + expireDate;
        }

        const data = await this._doApiCall(apiUrlShares, 'POST', { "Content-Type": "application/x-www-form-urlencoded", }, shareFormData);

        if (data && data.url) {
            if (this.useDlPassword) {
                await UploadStatus.password(uploadId, downloadPassword);
            }
            return data.url;
        }
        return null;
    }

    /**
     * - Remove all unwanted parts like username, parameters, ...
     * - Convert punycode domain names to UTF-8
     * - URIencode special characters in path
     * @param {String} url An URL that might contain illegal characters, Punycode and unwanted parameters
     * @returns {?String} The cleaned URL or null if url is not a valid http(s) URL
     */
    _cleanUrl(url) {
        let u;
        try {
            u = new URL(url);
        } catch (_) {
            return null;
        }
        if (!RegExp(/^https?:$/).exec(u.protocol)) {
            return null;
        }
        let encoderUrl = u.origin.replace(u.hostname, punycode.toUnicode(u.hostname)) +
            encodepath(u.pathname);

        if (!this.noAutoDownload) {
            encoderUrl += (encoderUrl.endsWith("/") ? "" : "/") + "download";
        }
        return encoderUrl;
    }

    /**
     * Call a function of the Nextcloud/ownCloud web service API
     *
     * @param {string} suburl The function's URL relative to the API base URL or a full url
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {*} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {*} A Promise that resolves to the data element of the response
     */
    async _doApiCall(suburl, method = 'GET', additional_headers = undefined, body = undefined) {
        let url;
        if (suburl.startsWith(this.serverUrl)) {
            url = suburl;
        } else {
            url = this.serverUrl;
            url += apiUrlBase;
            url += suburl;
        }
        url += (suburl.includes('?') ? '&' : '?') + "format=json";

        let headers = this._apiHeaders;
        headers.Authorization = "Basic " + btoa(this.username + ':' + this.password);

        if (additional_headers) {
            headers = { ...headers, ...additional_headers, };
        }

        const fetchInfo = {
            method,
            headers,
            credentials: "omit",
        };
        if (undefined !== body) {
            fetchInfo.body = body;
        }

        try {
            const response = await fetch(url, fetchInfo);
            if (!response.ok) {
                return { _failed: true, status: response.status, statusText: response.statusText, };
            }
            const parsed = await response.json();
            if (!parsed || !parsed.ocs || !parsed.ocs.meta || !isFinite(parsed.ocs.meta.statuscode)) {
                return { _failed: true, status: 'invalid_json', statusText: "No valid data in json", };
            } else if (parsed.ocs.meta.statuscode >= 300) {
                return { _failed: true, status: parsed.ocs.meta.statuscode, statusText: parsed.ocs.meta.message, };
            } else {
                return parsed.ocs.data;
            }
        } catch (error) {
            return { _failed: true, status: error.name, statusText: error.message, };
        }
    }
}

export { CloudConnection };
