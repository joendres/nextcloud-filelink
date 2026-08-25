// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { UploadStatus } from "./uploadstatus.js";
import { DAVClient } from "./davclient.js";
import { CloudCapabilities } from "./cloudcapabilities.js";
import { generatePassword } from "./generatePassword.js";
import { encodepath } from "./utils.js";
import { toUnicode } from "../vendor/punycode.es6.js";

/**
 * OCS API endpoints, see [OCS APIs
 * overview](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/OCS/ocs-api-overview.html)
 */
const API_ENDPOINT = Object.freeze({
    USER_INFO: "ocs/v1.php/cloud/users/",
    USER_ID: "ocs/v1.php/cloud/user",
    SHARES: "ocs/v1.php/apps/files_sharing/api/v1/shares",
    GET_APP_TOKEN: "ocs/v1.php/core/getapppassword",
    CAPABILITIES: "ocs/v1.php/cloud/capabilities",
});

/**
 * The base URL for WebDAV file access
 */
const DAV_BASE = "remote.php/dav/files/";

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 * (API and DAV)
 */
class CloudConnection {
    #apiHeaders = {
        "OCS-APIREQUEST": "true",
    };

    /** @type {import("../lib/account.js").Account} */
    #account;

    /**
     * @param {import("../lib/account.js").Account} account A configured account
     */
    constructor(account) {
        this.#account = account;

        const manifest = browser.runtime.getManifest();
        this.#apiHeaders["User-Agent"] = "Filelink for *cloud/" + manifest.version;
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
            this.#account.serverUrl, this.#account.username, this.#account.password, DAV_BASE + this.#account.userId, this.#account.storageFolder);

        const response = await uploader.uploadFile(uploadId, fileName, fileObject);

        if (response.aborted) {
            return response;
        } else if (response.ok) {
            await UploadStatus.sharing(uploadId);
            const linkData = await this.#getShareLink(fileName, uploadId);
            const url = this.#cleanUrl(linkData.url);
            if (url) {
                // Add additional information introduced in TB 98
                const templateInfo = await this.#fillTemplate(linkData.expiration);
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
        return { error: true, };
    }

    /**
     * Set information used to fill the text template in the message, currently
     * only the fields download_password_protected and download_expiry_date
     * @returns {messenger.cloudFile.CloudFileTemplateInfo} The relevant information for the current upload
     */
    async #fillTemplate(expiration) {
        const capabilities = await CloudCapabilities.get(this.#account.accountId);

        const templateInfo = {
            download_password_protected: this.#account.useDlPassword,
            service_icon: capabilities.service_icon,
        };

        if (expiration) {
            templateInfo.download_expiry_date = {
                timestamp: CloudConnection.#expirationToTicks(expiration, capabilities.user_timezone),
            };
        }

        // If the account has no name configured, use the product_name.
        // Otherwise the account name is used automatically
        const accountName = await this.#account.name();
        if (accountName === "*cloud" || undefined === accountName) {
            templateInfo.service_name = capabilities.cloud_productname;
        }

        return templateInfo;
    }

    static #expirationToTicks(serverExpiration, timeZone) {
        const match = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)$/.exec(serverExpiration);
        if (!match) { return undefined };
        // Remove the complete match at the beginning
        match.shift();
        // Months are zero based
        match[1]--;

        if (timeZone) {
            try {
                // Find the offset of the timezone
                const asUTC = Date.UTC(...match);
                const formatter = new Intl.DateTimeFormat("en-US", {
                    timeZone,
                    year: "numeric", month: "numeric", day: "numeric",
                    hour: "numeric", minute: "numeric", second: "numeric",
                    hour12: false,
                });
                const parts = {};
                formatter.formatToParts(asUTC).map(({ type, value }) => (parts[type] = value))
                const offset = asUTC - Date.UTC(
                    parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second
                );

                // Apply it
                return asUTC + offset;
            } catch (_) {
                // Something went wrong, most likely the timezone is invalid.
                // Ignore the error and return it as UTC (best guess)
            }
        }
        return Date.UTC(...match);
    }

    /**
     * Get free space from the cloud
     * @param {CloudCapabilities} capabilities 
     * @returns {Promise<number>} The available quota of the storage folder in bytes, or a negative value if it can't be determined or no quota is set
     */
    getFreeSpaceInfo(capabilities) {
        if (capabilities.has_dav_quota_bug) {
            // oCIS and OpenCloud don't return the available quota on PROPFIND, but the
            // entire quota: https://github.com/owncloud/ocis/issues/8197, so
            // use user quota instead
            return this.#getUserQuota();
        }
        return this.#getDAVQuota();
    }

    /**
     * Use WebDAV PROPFIND to get quota in storage folder, going up the folder
     * tree if the folder does not exist
     * @returns {Promise<number>}
     */
    async #getDAVQuota() {
        const dc = new DAVClient(
            this.#account.serverUrl,
            this.#account.username,
            this.#account.password,
            DAV_BASE + this.#account.userId,
            this.#account.storageFolder);

        let folder = this.#account.storageFolder;
        let quotaInfo = await dc.getQuotaAvailableBytes(folder);
        // If the folder doesn't exist (yet), got up the tree
        while (quotaInfo.status === 404 && folder !== '/') {
            folder = folder.split('/').slice(0, -1).join('/') || '/';
            quotaInfo = await dc.getQuotaAvailableBytes(folder);
        };
        const spaceRemaining = Number(quotaInfo.spaceRemaining);
        return spaceRemaining >= 0 && spaceRemaining <= Number.MAX_SAFE_INTEGER ? spaceRemaining : -1;
    }

    /**
     * Use user quota to determine free space
     */
    async #getUserQuota() {
        const data = await this.#doApiCall(API_ENDPOINT.USER_INFO + this.#account.userId);
        const free = Number(data?.quota?.free);
        return free >= 0 && free <= Number.MAX_SAFE_INTEGER ? free : -1;
    }

    /**
     * Get the capabilities object from the cloud server
     * @returns {Promise<{version:*, capabilities:*}|string>} An object
     * containing the properties version and capabilities, or a status string
     * if the API call failed. version and or capabilities are empty objects
     * if the server reply did not contain the elements
     */
    async getCapabilities() {
        const data = await this.#doApiCall(API_ENDPOINT.CAPABILITIES);
        if (data._failed) {
            return String(data.status ?? 0);
        }
        data.version ??= {};
        data.capabilities ??= {};
        return data;

    }

    /**
     * 
     * @returns {Promise<{id:string|undefined, status:string|undefined}>}
     */
    async getUserId() {
        let data = await this.#doApiCall(API_ENDPOINT.USER_ID);
        if (!data.id && data._failed) {
            // If login failed, we might be using an app token which sometimes
            // requires a lowercase user name
            const oldname = this.#account.username;
            this.#account.username = this.#account.username.toLowerCase();
            data = await this.#doApiCall(API_ENDPOINT.USER_ID);
            if (data._failed) {
                // Nope, it's not the character case, restore username
                this.#account.username = oldname;
                return data;
            }
        }
        // Nextcloud and ownCloud use this RE to check usernames created
        // manually
        if (data.id && !data.id.match(/^[a-zA-Z0-9 _.@\-']+$/)) {
            /* The userid contains characters that ownCloud and Nextcloud
            don't like. This might happen with external ids as eg supplied via
            SAML. One real world example: Guest users in an ADFS tenant have
            #EXT# in their userid. Those IDs seem to work over the API but (at
            least) break the web interface. */
            data.id = encodeURIComponent(data.id);
        }
        return data;
    }

    /**
     * Fetches a new app password from the Nextcloud/ownCloud web service and
     * replaces the current password with it
     */
    async getAppPassword() {
        const data = await this.#doApiCall(API_ENDPOINT.GET_APP_TOKEN);
        if (data?.apppassword) {
            // Test if the apppassword really works with the given username
            const oldpassword = this.#account.password;
            this.#account.password = data.apppassword;
            const r = await this.#doApiCall(API_ENDPOINT.USER_ID);
            this.#account.password = oldpassword;
            // r.status might be undefined
            if (!r._failed && !(r.status >= 900)) {
                return data.apppassword;
            }
        }
        return null;
    }

    /**
     * Validate the download password using the validation web service url from capabilities.
     * If there is no such url, only check if the password is empty
     * @param {string} downloadPassword The password to validate
     * @param {string} password_validate_url The validateion url from capabilities
     * @returns {*} An object containing either the validation status (and reason for failure) or error information if web service failed
     */
    async validateDLPassword(downloadPassword, password_validate_url) {
        if (password_validate_url) {
            const data = await this.#doApiCall(password_validate_url,
                'POST',
                { "Content-Type": "application/x-www-form-urlencoded", },
                'password=' + encodeURIComponent(downloadPassword)
            );
            data.passed = !!data.passed;
            return data;
        } else if (!downloadPassword) {
            return { passed: false, reason: 'Password must not be empty.', };
        }
        return {
            passed: true,
            _failed: true,
            status: 'not_nc',
            statusText: 'Cloud does not validate passwords, probably not a Nextcloud instance.',
        };

    }
    /**
     * Generate a download password using the NC web service if its present or a local generator otherwise
     * @returns {string} A most probably valid password
     */
    async generateDLPassword() {
        const capabilities = await CloudCapabilities.get(this.#account.accountId);
        let data;
        if (capabilities.password_generate_url) {
            data = await this.#doApiCall(capabilities.password_generate_url);
        }
        // A password in data needs no sanitization because it is displayed, using textContent
        return data?.password || generatePassword(16);
    }

    /**
     * Get a share link for the file, reusing an existing one with the same
     * parameters
     * @param {string} fileName The name of the file to share
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {{url:string, expiration:string?}} The share link data object as returned by the OCS API. If no expiration is set, the property is null or "" depending on the cloud type.
     */
    async #getShareLink(fileName, uploadId) {
        const path_to_share = encodepath(this.#account.storageFolder + "/" + fileName);
        const expireDate = this.#account.useExpiry ? daysFromTodayIso(this.#account.expiryDays) : undefined;

        // It's not possible to retreive an display the password for an existing share
        if (!this.#account.useDlPassword) {
            //  Check if the file is already shared ...
            const existingShare = await this.#findExistingShare(path_to_share, expireDate);
            if (existingShare && existingShare.url) {
                return existingShare;
            }
        }
        return this.#makeNewShare(path_to_share, expireDate, uploadId);

        /**
         * Adds the given number of days to the current date and returns the
         * resulting date in the format 'YYYY-MM-DD'
         * @param {number} days Number of days to add
         */
        function daysFromTodayIso(days) {
            const d = new Date();
            d.setTime(Date.now() + days * 24 * 60 * 60 * 1000);
            return d.toISOString().slice(0, 10);
        }
    }

    /**
     * Check if the file is already shared with the same parameters
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @returns {{url:string, expiration:string?}|undefined} The share link data object as returned by the OCS API. If no expiration is set, the property is null or "" depending on the cloud type.
     */
    async #findExistingShare(path_to_share, expireDate) {
        const shareinfo = await this.#doApiCall(API_ENDPOINT.SHARES + "?path=" + path_to_share);

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
                // Check for falsy because Nextcloud and ownCloud Classic return null while oCIS and OpenCloud return ""
                (!this.#account.useExpiry && !share.expiration) ||
                (this.#account.useExpiry && share.expiration&& share.expiration.startsWith(expireDate))
            ));
    }

    /**
     * Share the file
     * @param {string} path_to_share The encoded path of the file
     * @param {string} expireDate The expiry date, encoded as ISO
     * @param {string} uploadId The id of the upload created in background.js
     * @returns {{url:string, expiration:string?}|undefined} The share link data object as returned by the OCS API. If no expiration is set, the property is null or "" depending on the cloud type.
     */
    async #makeNewShare(path_to_share, expireDate, uploadId) {
        let shareFormData = "path=" + path_to_share;
        shareFormData += "&shareType=3"; // 3 = public share

        let downloadPassword = this.#account.downloadPassword;
        if (this.#account.useDlPassword) {
            if (this.#account.useGeneratedDlPassword) {
                downloadPassword = await this.generateDLPassword();
            }
            shareFormData += "&password=" + encodeURIComponent(downloadPassword);
        }

        if (undefined !== expireDate) {
            shareFormData += "&expireDate=" + expireDate;
        }

        const data = await this.#doApiCall(
            API_ENDPOINT.SHARES,
            'POST',
            { "Content-Type": "application/x-www-form-urlencoded", },
            shareFormData
        );

        if (data?.url && this.#account.useDlPassword) {
            await UploadStatus.password(uploadId, downloadPassword);
        }

        return data;
    }

    /**
     * - Remove all unwanted parts like username, parameters, ...
     * - Convert punycode domain names to UTF-8
     * - URIencode special characters in path
     * @param {String} url An URL that might contain illegal characters, Punycode and unwanted parameters
     * @returns {?String} The cleaned URL or null if url is not a valid http(s) URL
     */
    #cleanUrl(url) {
        let u;
        try {
            u = new URL(url);
        } catch (_) {
            return null;
        }
        if (!RegExp(/^https?:$/).exec(u.protocol)) {
            return null;
        }
        let encoderUrl = u.origin.replace(u.hostname, toUnicode(u.hostname)) +
            encodepath(u.pathname);

        if (!this.#account.noAutoDownload) {
            encoderUrl += (encoderUrl.endsWith("/") ? "" : "/") + "download";
        }
        return encoderUrl;
    }

    /**
     * Call a function of the Nextcloud/ownCloud web service API
     *
     * @param {string} apiUrl The API endpoint's URL
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {Object<string,string>} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {Promise<Object<string,*>>} A Promise that resolves to the data element of the response
     */
    async #doApiCall(apiUrl, method = 'GET', additional_headers = {}, body = undefined) {
        const url = new URL(apiUrl, this.#account.serverUrl);
        url.searchParams.append("format", "json");

        const headers = {
            ...this.#apiHeaders,
            Authorization: "Basic " + btoa(this.#account.username + ':' + this.#account.password),
            ...additional_headers,
        };

        const fetchInfo = {
            method,
            headers,
            credentials: "omit",
        };
        if (undefined !== body) {
            fetchInfo.body = body;
        }

        try {
            // Semgrep-False-Positive: apiUrl is restricted to the configured
            // cloud server or to a validated cloud-provided API URL;
            // arbitrary user-supplied destinations are not accepted here.
            const response = await fetch(url, fetchInfo); // nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
            if (!response.ok) {
                return { _failed: true, status: response.status, statusText: response.statusText, };
            }
            const parsed = await response.json();
            if (!isFinite(parsed?.ocs?.meta?.statuscode)) {
                return { _failed: true, status: 'invalid_json', statusText: "No valid data in json", };
            } else if (parsed.ocs.meta.statuscode >= 300) {
                return { _failed: true, status: parsed.ocs.meta.statuscode, statusText: parsed.ocs.meta.message, };
            }
            return parsed.ocs.data;

        } catch (error) {
            return { _failed: true, status: error.name, statusText: error.message, };
        }
    }
}

export { CloudConnection }