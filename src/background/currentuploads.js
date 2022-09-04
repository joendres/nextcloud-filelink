export class CurrentUploads {
    /**
     * Stores an XMLHttpRequest
     * @param {string} key The id of the upload
     * @param {XMLHttpRequest} value The XMLHttpRequest for this upload
     */
    static add(key, value) {
        CurrentUploads[key] = value;
    }

    /**
     * Removes the XMLHttpRequest of an upload
     * @param {string} key The id of the upload
     */
    static remove(key) {
        delete CurrentUploads[key];
    }

    /**
     * Retrieves the XMLHttpRequest for an upload
     * @param {string} key The id of the upload
     * @returns {XMLHttpRequest|undefined}
     */
    static get(key) {
        return CurrentUploads[key];
    }

    /**
     * Aborts an upload
     * @param {string} key The id of the upload
     */
    static abort(key) {
        /** @type {XMLHttpRequest} */
        const request = CurrentUploads[key];
        if (request && request.abort) {
            request.abort();
        }
    }
}