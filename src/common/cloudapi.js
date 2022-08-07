const apiUrlBase = "ocs/v1.php";

export class CloudAPI {
    /**
     * Call a function of the Nextcloud/ownCloud web service API
     *
     * @param {CloudAccount} account The account to use for the call
     * @param {string} suburl The function's URL relative to the API base URL or a full url
     * @param {string} [method='GET'] HTTP method of the function, default GET
     * @param {*} [additional_headers] Additional Headers this function needs
     * @param {string} [body] Request body if the function needs it
     * @returns {*} A Promise that resolves to the data element of the response
     */
    static async doApiCall(account, suburl, method = 'GET', additional_headers = undefined, body = undefined) {
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
            // deepcode ignore Ssrf: The input is checked, but Snyk can't see that.
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