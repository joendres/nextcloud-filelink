import { Localize } from "../common/localize.js";

// Establish messaging with background worker
var port;

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

port = browser.runtime.connect();
port.onMessage.addListener(updateStatusDisplay);

Localize.addLocalizedLabels();
// Unsuccessful uploads remain in the popup window until this button is pressed
button_clear.addEventListener('click', () => port.postMessage('clearcomplete'));

port.postMessage("sendstatus");

/**
 * Fills the status popup with content
 * 
 * @param {Map<string,Status>} uploads The Map with Status objects for all active uploads as received via message
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
            if (true === a[1].error || a[1].status === 'generatedpassword') { return true; }
        }
        return false;
    }
}

/**
 * Fill one row of the table with information from a Status object
 * 
 * @param {Status} status The Status object to display
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
    } else if (status.status === 'uploading') {
        let progress = document.createElement('progress');
        progress.value = status.progress;
        div.appendChild(progress);
    } else if (status.status === 'generatedpassword') {
        div.textContent = browser.i18n.getMessage('status_password', status.password);
    } else {
        div.textContent = browser.i18n.getMessage(`status_${status.status}`);
    }
    status_lines.appendChild(div);

    // Add the copy button as a placeholder
    div = template_copy.cloneNode(true);
    if (status.status === 'generatedpassword') {
        const button = div.querySelector("button");
        button.addEventListener('click', () => navigator.clipboard.writeText(status.password));
        button.classList.remove("hidden");
    }
    status_lines.appendChild(div);
}
