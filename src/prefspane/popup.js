/* MIT License

Copyright (c) 2020 Johannes Endres

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

/* exported popup */

const msgContainer = document.querySelector("#msg_container");
const errorPopup = document.querySelector("#error_popup");
const warningPopup = document.querySelector("#warning_popup");
const successPopup = document.querySelector("#success_popup");

class popup {
    /**
     * Show an error
     * @param {number} err_num The number of te error message to show, ideally use the return code
     */
    static async error(err_num) {
        this._openPopup(errorPopup, browser.i18n.getMessage(`error_${err_num}`));
    }

    /**
     * Show a warning
     * @param {string} messageId The id of the localized string
     */
    static async warn(messageId) {
        this._openPopup(warningPopup, browser.i18n.getMessage(messageId));
    }

    /**
     * Show the success popup for 1.5 seconds
     */
    static async success() {
        const p = this._openPopup(successPopup, browser.i18n.getMessage("success"));
        setTimeout(() => p.remove(), 1500);
    }

    /**
     * Actually opens the popup
     * @param {*} popup The HTML element to open
     * @param {string} message The message to display
     */
    static _openPopup(popup, message) {
        const new_box = popup.cloneNode(true);
        new_box.querySelector(".popup_message").textContent = message;
        new_box.hidden = false;
        new_box.querySelector(".msg_bar_closebtn").onclick = this.close;
        return msgContainer.appendChild(new_box);
    }

    /**
     * Closes the parent of the close button that has been clicked
     * @param {event} e The onClick event on the close button
     */
    static close(e) {
        e.target.parentElement.remove();
    }

    /**
     * Close all popups that might be open
     */
    static async clear() {
        while (msgContainer.firstChild) {
            msgContainer.firstChild.remove();
        }
    }
}