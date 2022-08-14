import { FormHandler } from "./formhandler.js";
import { Popup } from "./popup/popup.js";

/**
 * Handle the input fields in the download paswords fieldset
 */
export class DownloadPasswordFieldHandler {

    /**
     * Add event listeners to the form elements
     */
    static addListeners() {
        document.getElementsByName("DownloadPasswordRadio").forEach(
            radio => radio.addEventListener("change",
                DownloadPasswordFieldHandler.syncInputStateToRadio));
    }

    /**
     * Set state of download password input field to state of radio button
     */
    static syncInputStateToRadio() {
        /** @type {HTMLInputElement} */
        const downloadPassword = document.querySelector("#downloadPassword");
        /** @type {HTMLInputElement} */
        const oneDLPassword = document.querySelector("#oneDLPassword");

        downloadPassword.disabled = !oneDLPassword.checked;
        downloadPassword.required = oneDLPassword.checked;

        FormHandler.updateButtons();
    }

    /**
     * Fill in data from the CloudAccount object that is not yet handled
     * @param {CloudAccount} account The CloudAccount linked to the open dialog
     */
    static fillData(account) {
        /** @type {HTMLInputElement} */
        const useNoDlPassword = document.querySelector("#useNoDlPassword");
        if (account.enforce_password) {
            /** @type {HTMLInputElement} */
            const oneDLPassword = document.querySelector("#oneDLPassword");
            /** @type {HTMLInputElement} */
            const useGeneratedDlPassword = document.querySelector("#useGeneratedDlPassword");
            /** @type {HTMLInputElement} */
            const advanced_options = document.querySelector("#advanced_options");

            useNoDlPassword.disabled = true;
            if (useNoDlPassword.checked) {
                useNoDlPassword.checked = false;
                useGeneratedDlPassword.checked = !oneDLPassword.checked;
                DownloadPasswordFieldHandler.syncInputStateToRadio();
                advanced_options.open = true;
                Popup.error('password_enforced');
            }
        } else {
            useNoDlPassword.disabled = false;
        }
        DownloadPasswordFieldHandler.syncInputStateToRadio();
    }

    /**
     * Currently only validates a download password if that is selected
     * @param {CloudAccount} account The CloudAccount linked to the open dialog
     */
    static async postCloudUpdate(account) {
        /* Try to validate the download password against Nextcloud */
        /** @type {HTMLInputElement} */
        const oneDLPassword = document.querySelector("#oneDLPassword");
        if (oneDLPassword.checked) {
            if (!await account.validateDLPassword()) {
                Popup.error('invalid_pw', account.errmsg || '(nothing)');
            }
        }
    }
}
