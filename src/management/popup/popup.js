// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Localize } from "../../common/localize.js";

/**
 * Static class that contains all the methods for handling message popups in the management pane
 */
export class Popup {
    /**
     * Show an error
     * @param {string} err_id The id of te error to show a message for, eg. use the status code or error type
     * @param  {...string} moreInfo Additional strings to put into the placeholders of the error message
     */
    static error(err_id, ...moreInfo) {
        Popup.openPopup("error", Localize.getErrorMessage(err_id, moreInfo));
    }

    /**
     * Show a warning
     * @param {string} messageId The id of the localized string
     * @param  {...string} moreInfo Additional strings to put into the placeholders of the error message
     */
    static warn(messageId, ...moreInfo) {
        Popup.openPopup("warning", Localize.getWarningMessage(messageId, moreInfo));
    }

    /**
     * Show the success popup for 3 seconds
     */
    static async success() {
        const p = Popup.openPopup("success", Localize.getSuccessMessage());
        await new Promise((resolve) => setTimeout(resolve, 3000));
        p.remove();
    }

    /**
     * Actually opens the popup
     * @param {string} kind The kind of template to use, define in management.html
     * @param {string} message The message to display
     * @returns {Node} The newly created popup
     */
    static openPopup(kind, message) {
        /** @type {HTMLDivElement} */
        const msg_container = document.querySelector("#msg_container");

        /** @type {HTMLTemplateElement} */
        const template = document.querySelector(`#${kind}_popup`);
        /** @type {DocumentFragment} */
        const new_box = template.content.cloneNode(true);
        new_box.querySelector(".popup_message").textContent = message;
        new_box.querySelector(".msg_bar_closebtn").onclick = Popup.close;
        msg_container.appendChild(new_box);
        return msg_container.lastChild;
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
    static clear() {
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
        /** @type {HTMLDivElement} */
        const msg_container = document.querySelector("#msg_container");
        return !msg_container.firstChild;
    }
}
