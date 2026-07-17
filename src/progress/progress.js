// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { STATUS, UploadStatus } from "../lib/uploadstatus.js";

/**
 * Initialize the status page: populate the table with all currently active
 * uploads, register a listener for future status changes, and wire up the
 * "Clear completed" button.
 */
(async () => {
    const allStatus = await UploadStatus.getAll();
    for (const uploadId in allStatus) {
        showStatusRow(uploadId, allStatus[uploadId]);
    }

    browser.storage.session.onChanged.addListener(updateChangedStatus);

    const clearButton = document.getElementById('buttonClear');
    clearButton.addEventListener('click', UploadStatus.clearComplete);

    hideShowClearButton();
})();

/**
 * Check whether the table contains any uploads that have completed or failed,
 * i.e. rows that the user could clear.
 * @returns {boolean} True if at least one completed or failed upload is present
 */
function tableHasCompletedUploads() {
    const table = document.querySelector('table');
    // Is there an upload in error state?
    if (table.querySelector('.error')) {
        return true;
    }
    // Is there something to copy (a copy button in the table visible)?
    for (const button of table.querySelectorAll('button')) {
        if (!button.hidden) {
            return true;
        }
    }
    return false;
}

/**
 * Show the "Clear completed" button if there are completed or failed uploads,
 * otherwise hide it.
 */
function hideShowClearButton() {
    const clearButton = document.getElementById('buttonClear');
    if (tableHasCompletedUploads()) {
        clearButton.hidden = false;
    } else {
        clearButton.hidden = true;
    }
}

/**
 * Handle a `browser.storage.session.onChanged` event by updating or removing
 * the affected table rows and refreshing the "Clear completed" button.
 * @param {Object} changes Object of uploadId: {oldValue, newValue} change objects
 */
function updateChangedStatus(changes) {
    for (const uploadId in changes) {
        const newValue = changes[uploadId].newValue;
        if (newValue) {
            showStatusRow(uploadId, newValue);
        } else {
            removeRow(uploadId);
        }
    }
    hideShowClearButton();
}

/**
 * Remove the table row for an upload, if it exists.
 * @param {string} uploadId The unique ID of the upload
 */
function removeRow(uploadId) {
    const tr = document.getElementById(uploadId);
    if (tr) {
        tr.remove();
    }
}

/**
 * Create or update the table row for an upload to reflect its current status.
 * @param {string} uploadId The unique ID of the upload
 * @param {{ filename: string, error: boolean, status: string,
 * progress?: number, password?: string }} newValue The new status object
 */
function showStatusRow(uploadId, newValue) {
    const tr = getStatusRow(uploadId, newValue.filename);
    const statusCell = tr.querySelectorAll('td')[1];
    const copyButton = tr.querySelector('button');

    if (newValue.error) {
        showError(newValue.status);
    } else {
        switch (newValue.status) {
            case STATUS.UPLOADING:
                showProgress(newValue.progress);
                break;

            case STATUS.HASPASSWORD:
                showPassword(newValue.password);
                break;

            default:
                showStatus(newValue.status);
                break;
        }
    }

    /** Display a plain localized status string in the status cell. */
    function showStatus(status) {
        statusCell.classList.remove('error');
        statusCell.textContent = browser.i18n.getMessage(`status_${status}`);

    }

    /** Display a localized error message in the status cell and apply error styling. */
    function showError(status) {
        statusCell.classList.add('error');
        statusCell.textContent =
            browser.i18n.getMessage('status_error',
                browser.i18n.getMessage(`status_${status}`));
    }

    /** Display the download password and reveal the copy-to-clipboard button. */
    function showPassword(password) {
        statusCell.textContent = browser.i18n.getMessage('status_password', password);
        copyButton.hidden = false;
        copyButton.addEventListener('click', () => navigator.clipboard.writeText(password));
    }

    /** Render or update a <progress> element in the status cell. */
    function showProgress(progress) {
        const meter = document.createElement('progress');
        meter.value = progress;
        if (statusCell.firstChild) {
            statusCell.firstChild.replaceWith(meter);
        } else {
            statusCell.appendChild(meter);
        }
    }
}

/**
 * Return the existing table row for an upload, or create and append a new one.
 * @param {string} uploadId The unique ID of the upload (used as the row's id)
 * @param {string} filename The name of the file being uploaded
 * @returns {HTMLTableRowElement}
 */
function getStatusRow(uploadId, filename) {
    let tr = document.getElementById(uploadId);
    if (!tr) {
        tr = makeNewRow(uploadId, filename);
        document.querySelector("table").appendChild(tr);
    }
    return tr;
}

/**
 * Create a new table row from the `#row_template` element.
 * @param {string} uploadId Used as the row's id attribute
 * @param {string} filename Displayed in the first cell of the row
 * @returns {HTMLTableRowElement}
 */
function makeNewRow(uploadId, filename) {
    const template = document.getElementById('row_template');
    const fragment = document.importNode(template.content, true)
    const tr = fragment.querySelector('tr');

    tr.id = uploadId;
    tr.querySelector('td').textContent = filename;
    return tr;
}