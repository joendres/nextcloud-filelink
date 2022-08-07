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
}
