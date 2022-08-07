import { Popup } from "./popup/popup.js";

/**
 * Handle the input fields in the account_fields fieldset
 */
export class AccountFieldHandler {
    /**
     * Sanitize input data according to local rules
     * @param {CloudAccount} cc The CloudAccount linked to the open form
     * @returns Persistent data, that will be used after the cloud update
     */
    static preCloudUpdate(cc) {
        /** @type {HTMLInputElement} */
        const serverUrl = document.querySelector("#serverUrl");
        /** @type {HTMLInputElement} */
        const password = document.querySelector("#password");
        /** @type {HTMLInputElement} */
        const username = document.querySelector("#username");

        const url = new URL(serverUrl.value);
        // Remove double slashes from url
        const shortpath = url.pathname.split('/').filter(e => "" !== e);

        // If user pasted complete url of file app, extract cloud base url
        if (shortpath[shortpath.length - 2] === 'apps' &&
            (shortpath[shortpath.length - 1] === 'files' || shortpath[shortpath.length - 1] === 'dashboard')) {
            shortpath.pop();
            shortpath.pop();
            if (shortpath[shortpath.length - 1] === 'index.php') {
                shortpath.pop();
            }
        }
        serverUrl.value = url.origin + '/' + shortpath.join('/');

        if (url.protocol !== "https:") {
            Popup.warn("insecure_http");
        }

        // Make sure, url end with a slash
        if (!serverUrl.value.endsWith('/')) {
            serverUrl.value += '/';
        }

        if (!password.value.match(/^[\x21-\x7e]+$/)) {
            Popup.warn('nonascii_password');
        }

        return {
            needsNewToken: password.value !== cc.password ||
                username.value !== cc.username ||
                serverUrl.value !== cc.serverUrl,
        };
    }

    /**
     * 
     * @param {CloudAccount} cc The CloudAccount linked to the open form
     * @param {*} persist Persistent data as returned by preCloudUpdate
     */
    static async postCloudUpdate(cc, persist) {
        if (persist.needsNewToken) {
            await cc.convertToApppassword();
        }
    }
}
