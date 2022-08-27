export class Localize {
    /**
     * Set all the labels to localized strings
     */
    static async addLocalizedLabels() {
        document.querySelectorAll("[data-message]")
            .forEach(element => {
                element.textContent = browser.i18n.getMessage(element.dataset.message);
            });
    }

    /**
     * Localizes a placeholder string in the format used in manifest.json
     * @param {string} msg_string The sting to localize
     * @returns {string} The localized string if it exists, the input string otherwise
     */
    static localizeMSGString(msg_string) {
        return msg_string.replace(/^__MSG_([@\w]+)__$/, replacer);

        /**
         * Find the String that the __MSG refers to 
         * @param {string} matched The __MSG_...___ string
         * @param {string} key The variable part of the string, used as the key to find the localization
         * @returns {string} The localized string or matched if none found
         */
        function replacer(matched, key) {
            return browser.i18n.getMessage(key) || matched;
        }
    }

    /**
     * Get a localized error message to show in the management page Popup. A
     * string error_$error_id should be defined in messages.json, otherwise
     * error_0 is used.
     * @param {string} err_id The id of the error that happened
     * @param {string[]} details Additionals information to put into the
     * placeholders of the error message
     * @returns {string} The localized string
     */
    static getErrorMessage(err_id, details) {
        return browser.i18n.getMessage(`error_${err_id}`, details) ||
            // No message for this error, show the default one
            browser.i18n.getMessage('error_0', err_id);
    }

    /**
     * Get a localized warning message to show in the management page popup. A
     * string warn_$error_id must be defined in messages.json.
     * @param {string} id The id of the warning that is to be displayed
     * @param {string[]} details Additionals information to put into the
     * placeholders of the error message
     * @returns {string} The localized string
     */
    static getWarningMessage(id, details) {
        return browser.i18n.getMessage(`warn_${id}`, details);
    }

    /**
     * Get the localized message that indicates successful configuration of an account
     */
    static getSuccessMessage() {
        return browser.i18n.getMessage("success");
    }
}
