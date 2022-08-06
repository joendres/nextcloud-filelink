import { Status } from "./status.js";

/**
 * Class to hold status of one upload
 */
export class UploadStatus {
    /**
     * @param {string} filename The name of the file to upload
     */
    constructor(filename) {
        this.filename = filename;
        // Define display in ../progress/progress.js
        // and as status_<your string> in _locales
        this.status = 'preparing';
        this.progress = 0;
        this.error = false;
    }

    /**
     * Set new status, possible values defined in _locales and progress.js
    * @param {string} s The new status
    */
    async set_status(s) {
        this.status = s;
        Status.update();
    }

    /**
     * Set the upload status to error state
     */
    async fail() {
        this.error = true;
        Status.update();
    }

    /**
     * Update the upload progress
     * @param {number} p Fraction of data already transferred as a float
     */
    async set_progress(p) {
        this.progress = p;
        Status.update();
    }
}