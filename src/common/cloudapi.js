const apiUrlShares = "/apps/files_sharing/api/v1/shares";

export class CloudAPI {
    /**
     * Get the user's total and used quota
     * @param {CloudAccount} account The account to query
     * @returns {Promise<{free:number?,total:number?, used:number?}?>} The quota or null on error 
     */
    static async getQuota(account) {
        const apiUrlUserInfo = "/cloud/users/";
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
            const y = parseInt(x);
            return isFinite(y) ? y : null;
        }
    }

    /**
     * 
     * @param {CloudAccount} account The account to query
     * @returns {Promise<{capabilities:*?,version:*?}?>} The Capabilities object returned by the cloud or null on error
     */
    static async getCapabilities(account) {
        const apiUrlCapabilities = "/cloud/capabilities";
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
     * 
     * @param {CloudAccount} account The account to query
     * @returns {Promise<string?>} The user id or null on error
     */
    static async getUserId(account) {
        const apiUrlUserID = "/cloud/user";
        const data = await CloudAPI.doApiCall(account, apiUrlUserID);
        if (!!data && !!data.id) {
            return data.id;
        }
        return null;
    }

    /**
     * 
     * @param {CloudAccount} account The account to query
     * @returns {Promise<string?>} The AppPassword  or null on error
     */
    static async getAppPassword(account) {
        const apiUrlGetApppassword = "/core/getapppassword";
        const data = await CloudAPI.doApiCall(account, apiUrlGetApppassword);
        return !!data && !!data.apppassword ? data.apppassword : null;
    }

    /**
     * Check if a password meets the server's criteria by calling it's web
     * service. Currently only Nextcloud offers this.
     * @param {CloudAccount} account The account to query
     * @param {string} downloadPassword The password to check
     * @return {Promise<boolean?>}  True/false if the password meets/doesn't
     * meet the criteria or null on error
     */
    static async validateDownloadPassword(account, downloadPassword) {
        account.errmsg = "";
        if (!account.password_validate_url) {
            return null;
        }
        const result = await CloudAPI.doApiCall(account, account.password_validate_url, 'POST',
            { "Content-Type": "application/x-www-form-urlencoded", },
            'password=' + encodeURIComponent(downloadPassword));
        if (result._failed) {
            return null;
        }
        if (result.reason) {
            account.errmsg = result.reason;
        }
        return !!result.passed;
    }

    /**
     * Get a password from the cloud server that meets the rules configured there
     * @param {CloudAccount} account The account to query
     * @return {Promise<string?>} A password or null on error
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
     * @return {Promise<array?>} The share object returned by the cloud or null on error
     */
    static async getSharesForFile(account, path) {
        const data = await CloudAPI.doApiCall(account, apiUrlShares + "?path=" + path);
        return Array.isArray(data) ? data : null;
    }

    /**
    * Create a new share link for a file
    * @param {CloudAccount} account The account to query
    * @param {string} shareFormData The data describing the share as a urlencoded parameter string
    * @return {Promise<*?>} The password object returned by the cloud or null on error
    */
    static async getNewShare(account, shareFormData) {
        /** @todo */
        return CloudAPI.doApiCall(account, apiUrlShares, 'POST', { "Content-Type": "application/x-www-form-urlencoded", }, shareFormData);
    }

    /**
     * Call a function of the Nextcloud/ownCloud web service API
     * @param {CloudAccount} account The account to use for the call
     * @param {string} suburl The function's URL relative to the API base URL or a full url
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {Object<string,string>} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {*} A Promise that resolves to the data element of the response
     */
    static async doApiCall(account, suburl, method = 'GET', additional_headers = undefined, body = undefined) {
        const apiUrlBase = "ocs/v1.php";

        let url;
        if (suburl.startsWith(account.serverUrl)) {
            url = suburl;
        } else {
            url = account.serverUrl;
            url += apiUrlBase;
            url += suburl;
        }
        url += (suburl.includes('?') ? '&' : '?') + "format=json";

        const manifest = browser.runtime.getManifest();
        const headers = additional_headers || {};
        headers["OCS-APIREQUEST"] = "true";
        headers["User-Agent"] = "Filelink for *cloud/" + manifest.version;
        headers.Authorization = "Basic " + btoa(account.username + ':' + account.password);

        const fetchInfo = {
            method,
            headers,
            credentials: "omit",
        };
        if (undefined !== body) {
            fetchInfo.body = body;
        }

        try {
            // cSpell:ignore Ssrf Snyk
            // deepcode ignore Ssrf: The input is checked, but Snyk can't see that.
            const response = await fetch(url, fetchInfo);
            if (!response.ok) {
                account.errno = response.status;
                account.errmsg = response.statusText;
                return { _failed: true, status: response.status, statusText: response.statusText, };

            }
            const parsed = await response.json();
            if (!parsed || !parsed.ocs || !parsed.ocs.meta || !isFinite(parsed.ocs.meta.statuscode)) {
                account.errno = 999;
                account.errmsg = "No valid data in json";
                return { _failed: true, status: 'invalid_json', statusText: "No valid data in json", };
            } else if (parsed.ocs.meta.statuscode >= 300) {
                account.errno = parsed.ocs.meta.statuscode;
                account.errmsg = parsed.ocs.meta.message;
                return { _failed: true, status: parsed.ocs.meta.statuscode, statusText: parsed.ocs.meta.message, };
            } else {
                return parsed.ocs.data;
            }
        } catch (error) {
            account.errno = error.name;
            account.errmsg = error.message;
            return { _failed: true, status: error.name, statusText: error.message, };
        }
    }
}