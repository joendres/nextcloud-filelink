const apiUrlBase = "ocs/v1.php";
const apiUrlCapabilities = apiUrlBase + "/cloud/capabilities";
const apiUrlGetApppassword = apiUrlBase + "/core/getapppassword";
const apiUrlShares = apiUrlBase + "/apps/files_sharing/api/v1/shares";
const apiUrlUserID = apiUrlBase + "/cloud/user";
const apiUrlUserInfo = apiUrlBase + "/cloud/users/";

export class CloudAPI {
    /**
     * Get the user's total and used quota
     * @param {CloudAccount} account The account to query
     * @returns {Promise<{free:number?,total:number?, used:number?}?>} The quota or null on error 
     */
    static async getQuota(account) {
        const data = await CloudAPI.doApiCall(account, apiUrlUserInfo + account.userId);

        if (!data || !data.quota) {
            return null;
        }

        return {
            free: makeNumber(data.quota.free),
            total: makeNumber(data.quota.total),
            used: makeNumber(data.quota.used),
        };

        function makeNumber(x) {
            return isFinite(x) ? parseInt(x) : null;
        }
    }

    /**
     * @param {CloudAccount} account The account to query
     * @returns {Promise<{capabilities:*?,version:*?}?>} The Capabilities object returned by the cloud or null on error
     */
    static async getCapabilitiesAndVersion(account) {
        const data = await CloudAPI.doApiCall(account, apiUrlCapabilities);
        if (!data) {
            return null;
        }
        return {
            capabilities: data.capabilities || null,
            version: data.version || null,
        };
    }

    /**
     * Get the UserID corresponding to the account, might differ from the username
     * @param {CloudAccount} account The account to query
     * @returns {Promise<string?>} The user id or null on error
     */
    static async getUserId(account) {
        const data = await CloudAPI.doApiCall(account, apiUrlUserID);
        if (!!data && !!data.id) {
            return data.id;
        }
        return null;
    }

    /**
     * Get an app passwort for the current account, only on Nextcloud
     * @param {CloudAccount} account The account to query
     * @returns {Promise<string?>} The app password or null on error
     */
    static async getAppPassword(account) {
        const data = await CloudAPI.doApiCall(account, apiUrlGetApppassword);
        return !!data && !!data.apppassword ? data.apppassword : null;
    }

    /**
     * Check if a password meets the server's criteria by calling its web
     * service. Currently only Nextcloud offers this.
     * @param {CloudAccount} account The account to query
     * @param {string} downloadPassword The password to check
     * @returns {Promise<boolean?>}  True/false if the password meets/doesn't
     * meet the criteria or null on error
     */
    static async validateDownloadPassword(account, downloadPassword) {
        delete account.errmsg;
        if (!account.password_validate_url) {
            return null;
        }
        const result = await CloudAPI.doApiCall(account, account.password_validate_url, 'POST',
            { "Content-Type": "application/x-www-form-urlencoded", },
            'password=' + encodeURIComponent(downloadPassword));
        if (!result) {
            return null;
        }
        if (!result.passed && result.reason) {
            account.errmsg = result.reason;
        }
        return !!result.passed;
    }

    /**
     * Get a password from the cloud server that meets the rules configured there
     * @param {CloudAccount} account The account to query
     * @returns {Promise<string?>} A password or null on error
     */
    static async getGeneratedPassword(account) {
        if (account.password_generate_url) {
            const data = await CloudAPI.doApiCall(account, account.password_generate_url);
            if (!!data && !!data.password) {
                return data.password;
            }
        }
        return null;
    }

    /**
     * Gets a list of exiting shares for a file
     * @param {CloudAccount} account The account to query
     * @param {string} path The path of the file
     * @returns {Promise<array?>} The share object returned by the cloud or null on error
     */
    static async getSharesForFile(account, path) {
        const data = await CloudAPI.doApiCall(account, apiUrlShares + "?path=" + path);
        return Array.isArray(data) ? data : null;
    }

    /**
    * Create a new share link for a file
    * @param {CloudAccount} account The account to query
    * @param {string} path The full path to the file
    * @param {string} expireDate The date the share link will expire as an ISO date string
    * @returns {Promise<string?>} The news share url or null on error
    */
    static async getNewShare(account, path, expireDate) {
        let shareFormData = "path=" + path;
        shareFormData += "&shareType=3"; // 3 = public share

        if (account.oneDLPassword || account.useGeneratedDlPassword) {
            shareFormData += "&password=" + encodeURIComponent(account.downloadPassword);
        }

        if (account.useExpiry && expireDate) {
            shareFormData += "&expireDate=" + expireDate;
        }

        const data = await CloudAPI.doApiCall(account, apiUrlShares, 'POST',
            { "Content-Type": "application/x-www-form-urlencoded", }, shareFormData);

        if (data && data.url) {
            return data.url;
        }
        return null;
    }

    /**
     * Call a function of the Nextcloud/ownCloud web service API
     * @param {CloudAccount} account The account to use for the call
     * @param {string} func_url The function's complete url path or a full url
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {Object<string,string>} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {Promise<*?>} A Promise that resolves to the data element of the response or null on error
     */
    static async doApiCall(account, func_url, method = 'GET', additional_headers = {}, body = "") {
        const headers = additional_headers;
        headers["OCS-APIREQUEST"] = "true";
        headers["User-Agent"] = "Filelink for *cloud/" + browser.runtime.getManifest().version;
        headers.Authorization = "Basic " + btoa(account.username + ':' + account.password);

        const fetchInfo = {
            method,
            headers,
            credentials: "omit",
        };
        if (body) {
            fetchInfo.body = body;
        }

        try {
            const url = new URL(func_url, account.serverUrl);
            url.searchParams.append("format", "json");

            const response = await fetch(url, fetchInfo);
            if (!response.ok) {
                return null;
            }
            const parsed = await response.json();
            if (!isFinite(parsed.ocs.meta.statuscode) || parsed.ocs.meta.statuscode >= 300) {
                return null;
            } else {
                return parsed.ocs.data || null;
            }
        } catch (_) {
            return null;
        }
    }
}