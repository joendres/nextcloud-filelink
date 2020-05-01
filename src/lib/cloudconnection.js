/* MIT License

Copyright (c) 2020 Johannes Endres

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

/* global DavUploader  */
/* global encodepath  */
/* global daysFromTodayIso */
/* global punycode */
/* exported CloudConnection */

//#region  Configurable options and useful constants
const apiUrlBase = "/ocs/v1.php";
const apiUrlUserInfo = "/cloud/users/";
const apiUrlShares = "/apps/files_sharing/api/v1/shares";
const apiUrlGetApppassword = "/core/getapppassword";
const apiUrlCapabilities = "/cloud/capabilities";
const davUrlDefault = "/remote.php/dav/files/";
//#endregion

/**
 * This class encapsulates all calls to the Nextcloud or ownCloud web services
 * (API and DAV)
 */
class CloudConnection {
    //#region Constructors, load & store
    /**
     * @param {*} accountId Whatever Thunderbird uses as an account identifier
     */
    constructor(accountId) {
        this._accountId = accountId;
        this._apiHeaders = {
            "OCS-APIREQUEST": "true",
            "User-Agent": "Filelink for *cloud",
        };
        this._davUrl = null;
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
     * Upload a single file
     *
     * @param {number} fileId The id Thunderbird uses to reference the upload
     * @param {string} fileName w/o path
     *      @param {File} fileObject the local file as a File object
     */
    async uploadFile(fileId, fileName, fileObject) {
        // Get the server's actual DAV URL
        if (!this._davUrl) {
            // Fetch URL from capabilities
            const data = await this._doApiCall(apiUrlCapabilities);
            if (data && data.capabilities && data.capabilities.core && data.capabilities.core["webdav-root"]) {
                this._davUrl = "/" + data.capabilities.core["webdav-root"];
            } else {
                // Use default from docs instead
                this._davUrl = davUrlDefault + this.username;
            }
        }

        const uploader = new DavUploader(
            this.serverUrl, this.username, this.password, this._davUrl, this.storageFolder);
        const response = await uploader.uploadFile(fileId, fileName, fileObject);

        if (response.aborted) {
            return response;
        } else if (response.ok) {
            this.updateFreeSpaceInfo();
            return { url: (await this._getShareLink(fileName)) + "/download", aborted: false, };
        }
        throw new Error("Upload failed.");
    }

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
     * @returns {*} A data object that may contain error information (see _doApiCall)
     */
    async updateFreeSpaceInfo() {
        let spaceRemaining = -1;
        let spaceUsed = -1;

        const data = await this._doApiCall(apiUrlUserInfo + this.username);
        if (data && data.quota) {
            spaceRemaining = data.quota.free >= 0 ? data.quota.free : -1;
            spaceUsed = data.quota.used >= 0 ? data.quota.used : -1;
        }

        await messenger.cloudFile.updateAccount(this._accountId, { spaceRemaining, spaceUsed, });

        return data;
    }

    /**
     * Delete all the properties that are read from the server's capabilities to clean out old values
     */
    forgetCapabilities() {
        ['_davUrl', '_password_validate_url', '_password_generate_url', 'api_enabled',
            'public_shares_enabled', 'enforce_password', 'expiry_max_days',
            'cloud_versionstring', 'cloud_productname', 'cloud_type', 'cloud_supported',]
            .forEach(p => delete this[p]);
    }

    /**
     * Get useful information from the server and store it as properties
     */
    async updateCapabilities() {
        const data = await this._doApiCall(apiUrlCapabilities);
        if (!data._failed && data.capabilities) {
            // Remember the URL to use in WebDAV calls
            if (data.capabilities.core && data.capabilities.core["webdav-root"]) {
                this._davUrl = "/" + data.capabilities.core["webdav-root"];
            }

            if (data.capabilities.files_sharing) {
                // Don't test data.capabilities.files_sharing.api_enabled because the next line contains it all
                // Is public sharing enabled?
                this.public_shares_enabled = data.capabilities.files_sharing.public && !!data.capabilities.files_sharing.public.enabled;
                if (this.public_shares_enabled) {
                    // Remember if a download password is required
                    if (data.capabilities.files_sharing.public.password) {
                        if (data.capabilities.files_sharing.public.password.enforced_for && 'boolean' === typeof data.capabilities.files_sharing.public.password.enforced_for.read_only) {
                            // ownCloud
                            this.enforce_password = data.capabilities.files_sharing.public.password.enforced_for.read_only;
                        } else {
                            //Nextcloud                        
                            this.enforce_password = data.capabilities.files_sharing.public.password.enforced;
                        }
                    }
                    // Remember maximum expiry set on server
                    if (data.capabilities.files_sharing.public.expire_date && data.capabilities.files_sharing.public.expire_date.enforced) {
                        this.expiry_max_days = parseInt(data.capabilities.files_sharing.public.expire_date.days);
                        if (!isFinite(this.expiry_max_days) || this.expiry_max_days <= 0) {
                            delete this.expiry_max_days;
                        }
                    }
                }
            }

            // Remember password policy urls if they are present (AFAIK only in NC 17+)
            if (data.capabilities.password_policy && data.capabilities.password_policy.api) {
                this._password_validate_url = data.capabilities.password_policy.api.validate;
                this._password_generate_url = data.capabilities.password_policy.api.generate;
            }

            // Take version from capabilities
            this.cloud_versionstring = data.version.string;
            // Take name & type from capabilities
            if (data.capabilities.theming && data.capabilities.theming.name) {
                this.cloud_productname = data.capabilities.theming.name;
                this.cloud_type = "Nextcloud";
                this.cloud_supported = data.version.major >= 16;
            } else if (data.capabilities.core.status && data.capabilities.core.status.productname) {
                this.cloud_productname = data.capabilities.core.status.productname;
                this.cloud_type = "ownCloud";
                this.cloud_supported = data.version.major >= 10;
            } else {
                this.cloud_type = "Unsupported";
                this.cloud_supported = false;
            }
        }
        this.store();
        return data;
    }

    /**
     * Sets the "configured" property of Thunderbird's cloudFileAccount
     * to true if the is usable
     */
    async updateConfigured() {
        messenger.cloudFile.updateAccount(this._accountId, {
            configured:
                this.public_shares_enabled &&
                Boolean(this.serverUrl) &&
                Boolean(this.username) &&
                Boolean(this.password) &&
                Boolean(this.storageFolder) &&
                !(this.enforce_password && !this.useDlPassword) &&
                !(this.useDlPassword && !Boolean(this.downloadPassword)) &&
                !(this.useExpiry && !Boolean(this.expiryDays)) &&
                !(Boolean(this.expiry_max_days) && this.useExpiry && this.expiry_max_days < this.expiryDays),
        });
    }

    /**
     * Fetches a new app password from the Nextcloud/ownCloud web service and
     * replaces the current password with it
     */
    async convertToApppassword() {
        const data = await this._doApiCall(apiUrlGetApppassword);
        if (data && data.apppassword) {
            this.password = data.apppassword;
        }
        return this.password;
    }

    /**
     * Validate the download password using the validation web service url from capabilities.
     * If there is no such url, only check if the password is empty
     * @returns {*} An object containing either the validation status (and reason for failure) or error information if web service failed
     */
    async validateDLPassword() {
        if (this._password_validate_url) {
            // This is a full url, reduce it to a suburl as needed by _doApiCall
            const url_parts = this._password_validate_url.split('/');
            while (url_parts.length && 'v2.php' !== url_parts.shift()) { }

            return this._doApiCall('/' + url_parts.join('/'), 'POST',
                { "Content-Type": "application/x-www-form-urlencoded", },
                'password=' + encodeURIComponent(this.downloadPassword));
        } else if (!this.downloadPassword) {
            return { passed: false, reason: 'Password must not be empty.', };
        } else {
            return {
                _failed: true, status: 'not_nc',
                statusText: 'Cloud does not validate passwords, probably not a Nextcloud instance.',
            };
        }
    }
    //#endregion

    //#region Internal helpers
    /**
     * Get a share link for the file, reusing an existing one with the same
     * parameters
     * @param {string} fileName The name of the file to share
     * @returns {string} The share link
     */
    async _getShareLink(fileName) {
        const path_to_share = encodepath(this.storageFolder + "/" + fileName);

        let expireDate = this.useExpiry ? daysFromTodayIso(this.expiryDays) : undefined;

        //  Check if the file is already shared ...
        const shareinfo = await this._doApiCall(apiUrlShares + "?path=" + path_to_share);

        const existingShare = shareinfo.find(share =>
            /// ... and if it's a public share ...
            (share.share_type === 3) &&
            // ... with the same password (if any) ...
            // CAUTION: If no password is set Nextcloud has password===null, ownCloud has password===undefined
            (this.useDlPassword ? share.password === this.downloadPassword : !share.password) &&
            // ... and the same expiration date
            (
                (!this.useExpiry && share.expiration === null) ||
                (this.useExpiry && share.expiration !== null && share.expiration.startsWith(expireDate))
            ));

        if (existingShare && existingShare.url) {
            return punycode.toUnicode(existingShare.url);
        } else {
            let shareFormData = "path=" + path_to_share;
            shareFormData += "&shareType=3"; // 3 = public share

            if (this.useDlPassword) {
                shareFormData += "&password=" + encodeURIComponent(this.downloadPassword);
            }

            if (this.useExpiry) {
                shareFormData += "&expireDate=" + expireDate;
            }

            const data = await this._doApiCall(apiUrlShares, 'POST', { "Content-Type": "application/x-www-form-urlencoded", }, shareFormData);

            if (data && data.url) {
                return punycode.toUnicode(data.url);
            }
            else {
                throw new Error("Sharing failed.");
            }
        }
    }
    //#endregion

    //#region Wrapper for web service calls
    /**
     * Call a function of the Nextcloud/ownCloud web service API
     *
     * @param {string} suburl The function's URL relative to the API base URL
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {*} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {*} A Promise that resolves to the data element of the response
     */
    async _doApiCall(suburl, method = 'GET', additional_headers = undefined, body = undefined) {
        let url = this.serverUrl;
        url += apiUrlBase;
        url += suburl;
        url += (suburl.includes('?') ? '&' : '?') + "format=json";

        let headers = this._apiHeaders;
        headers.Authorization = "Basic " + btoa(this.username + ':' + this.password);

        if (additional_headers) {
            headers = { ...headers, ...additional_headers, };
        }

        const fetchInfo = {
            method,
            headers,
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
            if (!parsed || !parsed.ocs || !parsed.ocs.meta || !parsed.ocs.meta.statuscode) {
                return { _failed: true, status: 'invalid_json', statusText: "No valid data in json", };
            } else if (parsed.ocs.meta.statuscode !== 100) {
                return { _failed: true, status: parsed.ocs.meta.statuscode, statusText: parsed.ocs.meta.message, };
            } else {
                return parsed.ocs.data;
            }
        } catch (e) {
            return { _failed: true, status: e.name, statusText: e.message, };
        }
    }
    //#endregion
}