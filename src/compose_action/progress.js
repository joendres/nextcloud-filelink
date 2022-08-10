import { Statuses } from "common/statuses.js";
import { Localize } from "../common/localize.js";

/** @type {HTMLButtonElement} */
const button_clear = document.querySelector("#button_clear");
/** @type {HTMLDivElement} */
const status_lines = document.querySelector("#status_lines");
/** @type {HTMLDivElement} */
const no_uploads = document.querySelector("#no_uploads");
/** @type {HTMLDivElement} */
const template_copy = document.querySelector("#templates>.copy");
/** @type {HTMLDivElement} */
const template_cell = document.querySelector("#templates>.cell");

/** Establish messaging with background worker
 * @type {browser.runtime.Port} */
const port = browser.runtime.connect();
port.onMessage.addListener(updateStatusDisplay);
port.postMessage("update");

Localize.addLocalizedLabels();
// Unsuccessful uploads remain in the popup window until this button is pressed
button_clear.addEventListener('click', () => port.postMessage('clearcomplete'));

/**
 * Fills the status popup with content
 * 
 * @param {Map<string,UploadStatus>} uploads The Map with UploadStatus objects for all active uploads as received via message
 */
function updateStatusDisplay(uploads) {
    // Empty the grid
    while (status_lines.firstChild) {
        status_lines.firstChild.remove();
    }

    button_clear.classList.add('hidden');
    if (uploads.size === 0) {
        no_uploads.hidden = false;
    } else {
        no_uploads.hidden = true;
        if (has_information()) {
            button_clear.classList.remove('hidden');
        }
        // Fill the rows of the table
        // CAUTION: For a Map, the second argument to the callback is the key, not a number as in an array
        uploads.forEach(upload => fill_status_row(upload));
    }

    /**
     * @returns {boolean} true if any of the uploads is in error state
     */
    function has_information() {
        for (const a of uploads) {
            if (true === a[1].error || a[1].status === Statuses.GENERATEDPASSWORD) { return true; }
        }
        return false;
    }

    /**
     * Fill one row of the grid with information from an UploadStatus object
     * @param {UploadStatus} status The UploadStatus object to display
     */
    function fill_status_row(status) {
        // Append the file name
        let div = template_cell.cloneNode(true);
        div.textContent = status.filename;
        status_lines.appendChild(div);

        // Add the middle field 
        div = template_cell.cloneNode(true);
        if (status.error) {
            div.classList.add('error');
            div.textContent =
                browser.i18n.getMessage('status_error',
                    browser.i18n.getMessage(`status_${status.status}`));
        } else
            switch (status.status) {
                case Statuses.UPLOADING:
                    {
                        const progress = document.createElement('progress');
                        progress.value = status.progress;
                        div.appendChild(progress);
                    }
                    break;
                case Statuses.GENERATEDPASSWORD:
                    div.textContent = browser.i18n.getMessage('status_password', status.password);
                    break;
                default:
                    div.textContent = browser.i18n.getMessage(`status_${status.status}`);
                    break;
            }
        status_lines.appendChild(div);

        // Add the copy button as a placeholder
        div = template_copy.cloneNode(true);
        if (status.status === Statuses.GENERATEDPASSWORD) {
            const button = div.querySelector("button");
            button.addEventListener('click', () => navigator.clipboard.writeText(status.password));
            button.classList.remove("hidden");
        }
        status_lines.appendChild(div);
    }
}
