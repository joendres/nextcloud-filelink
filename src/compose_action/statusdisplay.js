import { Statuses } from "../common/statuses.js";

export class StatusDisplay {
    /**
     * Updates the status display grid in the progress popup
     * @param {Map<string,UploadStatus>} uploads All active uploads
     */
    static update(uploads) {
        /** @type {HTMLButtonElement} */
        const button_clear = document.querySelector("#button_clear");
        /** @type {HTMLDivElement} */
        const status_lines = document.querySelector("#status_lines");
        /** @type {HTMLDivElement} */
        const no_uploads = document.querySelector("#no_uploads");
        /** @type {DocumentFragment} */
        const template_copy = document.querySelector("#template_copy").content;
        /** @type {DocumentFragment} */
        const template_cell = document.querySelector("#template_cell").content;

        // Empty the grid
        while (status_lines.firstChild) {
            status_lines.firstChild.remove();
        }

        button_clear.classList.add('hidden');
        if (uploads.size === 0) {
            no_uploads.classList.remove('hidden');
        } else {
            no_uploads.classList.add('hidden');
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
            for (const value of uploads.values()) {
                if (true === value.error || value.status === Statuses.GENERATEDPASSWORD) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Fill one row of the grid with information from an UploadStatus object
         * @param {UploadStatus} status The UploadStatus object to display
         */
        function fill_status_row(status) {
            // Append the file name
            /** @type {DocumentFragment} */
            let template = template_cell.cloneNode(true);
            /** @type {HTMLDivElement} */
            let div = template.querySelector(".cell");
            div.textContent = status.filename;
            status_lines.appendChild(div);

            // Add the middle field 
            template = template_cell.cloneNode(true);
            div = template.querySelector(".cell");
            if (status.error) {
                div.classList.add('error');
                div.textContent =
                    browser.i18n.getMessage('status_error',
                        browser.i18n.getMessage(`status_${status.status}`));
            }
            else
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
            template = template_copy.cloneNode(true);
            div = template.querySelector(".copy");
            if (status.status === Statuses.GENERATEDPASSWORD) {
                const button = div.querySelector("button");
                button.addEventListener('click', () => navigator.clipboard.writeText(status.password));
                button.classList.remove("hidden");
            }
            status_lines.appendChild(div);
        }
    }
}