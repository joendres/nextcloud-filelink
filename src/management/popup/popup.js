/**
 * Static class that contains all the methods for handling message popups in the management pane
 */
export class Popup {
    /**
     * Show an error
     * @param {string} err_id The id of te error to show a message for, eg. use the status code or error type
     */
    static async error(err_id) {
        const error_popup = document.querySelector("#error_popup");

        Popup._openPopup(error_popup,
            browser.i18n.getMessage(`error_${err_id}`, Array.from(arguments).slice(1)) ||
            // No message for this error, show the default one
            browser.i18n.getMessage('error_0', err_id));
    }

    /**
     * Show a warning
     * @param {string} messageId The id of the localized string
     */
    static async warn(messageId) {
        const warning_popup = document.querySelector("#warning_popup");

        Popup._openPopup(warning_popup,
            browser.i18n.getMessage(`warn_${messageId}`, Array.from(arguments).slice(1)));
    }

    /**
     * Show the success popup for 3 seconds
     * 
     * @param {string} [messageId] The id of the message in _locales.
     */
    static async success(messageId = "success") {
        const success_popup = document.querySelector("#success_popup");

        const p = Popup._openPopup(success_popup, browser.i18n.getMessage(messageId));
        setTimeout(() => p.remove(), 3000);
    }

    /**
     * Actually opens the popup
     * @param {Node} template The HTML element to open
     * @param {string} message The message to display
     * @return {Node} The newly created popup
     */
    static _openPopup(template, message) {
        const msg_container = document.querySelector("#msg_container");

        const new_box = template.cloneNode(true);
        new_box.querySelector(".popup_message").textContent = message;
        new_box.hidden = false;
        new_box.querySelector(".msg_bar_closebtn").onclick = Popup.close;
        return msg_container.appendChild(new_box);
    }

    /**
     * Closes the parent of the close button that has been clicked
     * @param {Event} evt The Onclick event that resulted int the call
     */
    static close(evt) {
        evt.target.parentElement.remove();
    }

    /**
     * Close all popups that might be open
     */
    static async clear() {
        const msg_container = document.querySelector("#msg_container");

        while (msg_container.firstChild) {
            msg_container.firstChild.remove();
        }
    }

    /**
     * Is the popup area empty (no popup currently visible)
     * @returns {boolean}
     */
    static empty() {
        const msg_container = document.querySelector("#msg_container");
        return !Boolean(msg_container.firstChild);
    }
}

