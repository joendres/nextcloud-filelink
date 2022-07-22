class Localize {
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
        return msg_string.replace(
            /^__MSG_([@\w]+)__$/, (matched, key) => {
                return browser.i18n.getMessage(key) || matched;
            });
    }
}

/* exported Localize */