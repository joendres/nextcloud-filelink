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
        const downloadPassword = document.querySelector("#downloadPassword");
        const oneDLPassword = document.querySelector("#oneDLPassword");

        downloadPassword.disabled = !oneDLPassword.checked;
        downloadPassword.required = oneDLPassword.checked;

        FormHandler.updateButtons();
    }

    /**
     * Fill in data from the cloudConnection object that is not yet handled
     * @param {CloudConnection} cc The cloudConnection linked to the open dialog
     */
    static fillData(cc) {
        const useNoDlPassword = document.querySelector("#useNoDlPassword");
        if (cc.enforce_password) {
            const oneDLPassword = document.querySelector("#oneDLPassword");
            const useGeneratedDlPassword = document.querySelector("#useGeneratedDlPassword");
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
    }

    /**
     * Currently only validates a download password if that is selected
     * @param {CloudConnection} cc The cloudConnection linked to the open dialog
     */
    static async postCloudUpdate(cc) {
        /* Try to validate the download password against Nextcloud */
        const oneDLPassword = document.querySelector("#oneDLPassword");
        if (oneDLPassword.checked) {
            const result = await cc.validateDLPassword();
            if (false === result.passed) {
                Popup.error('invalid_pw', result.reason || '(none)');
            }
        }
    }
}
