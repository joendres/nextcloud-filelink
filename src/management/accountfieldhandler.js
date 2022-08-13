import { Popup } from "./popup/popup.js";

/**
 * Handle the input fields in the account_fields fieldset
 */
export class AccountFieldHandler {
    /**
     * Sanitize input data according to local rules
     * @param {CloudAccount} account The CloudAccount linked to the open form
     * @returns Persistent data, that will be used after the cloud update
     */
    static preCloudUpdate(account) {
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
            /** @todo This is too strict, also try to get app token on second try. */
            needsNewToken: password.value !== account.password ||
                username.value !== account.username ||
                serverUrl.value !== account.serverUrl,
        };
    }

    /**
     * 
     * @param {CloudAccount} account The CloudAccount linked to the open form
     * @param {*} persist Persistent data as returned by preCloudUpdate
     */
    static async postCloudUpdate(account, persist) {
        if (persist.needsNewToken) {
            await account.convertToApppassword();
        }
    }
}
