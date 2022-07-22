/**
 * Static class that contains all the methods for handling message popups in the management pane
 */
class Popup {
    /**
     * Show an error
     * @param {string} err_id The id of te error to show a message for, eg. use the status code or error type
     */
    static async error(err_id) {
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
        Popup._openPopup(warning_popup, browser.i18n.getMessage(`warn_${messageId}`, Array.from(arguments).slice(1)));
    }

    /**
     * Show the success popup for 3 seconds
     * 
     * @param {string} [messageId] The id of the message in _locales.
     */
    static async success(messageId = "success") {
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
        while (msg_container.firstChild) {
            msg_container.firstChild.remove();
        }
    }

    /**
     * Is the popup area empty (no popup currently visible)
     * @returns {boolean}
     */
    static empty() {
        return !Boolean(msg_container.firstChild);
    }
}

/* Make jshint happy */
/* exported Popup */
// Defined as ids in management.html
/* global msg_container, error_popup, warning_popup, success_popup */