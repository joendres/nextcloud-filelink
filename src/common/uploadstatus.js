/**
 * Class to hold status of one upload
 */
export class UploadStatus {
    /**
     * @param {string} filename The name of the file to upload
     */
    constructor(filename) {
        this.filename = filename;
        // and as status_<your string> in _locales
        this.status = 'preparing';
        this.progress = 0;
        this.error = false;
    }
}