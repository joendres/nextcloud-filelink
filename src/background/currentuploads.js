export class CurrentUploads {
    /**
     * Stores an XMLHttpRequest
     * @param {string} key The id of the upload
     * @param {XMLHttpRequest} value The XMLHttpRequest for this upload
     */
    static set(key, value) {
        if (!CurrentUploads.map) {
            CurrentUploads.map = new Map();
        }
        CurrentUploads.map.set(key, value);
    }

    /**
     * Removes the XMLHttpRequest of an upload
     * @param {string} key The id of the upload
     */
    static delete(key) {
        if (CurrentUploads.map) {
            CurrentUploads.map.delete(key);
        }
    }

    /**
     * Retrieves the XMLHttpRequest for an upload
     * @param {string} key The id of the upload
     * @returns {XMLHttpRequest|undefined}
     */
    static get(key) {
        if (!CurrentUploads.map) {
            return undefined;
        }
        CurrentUploads.map.get(key);
    }

    /**
     * Aborts an upload
     * @param {string} key The id of the upload
     */
    static abort(key) {
        const abortController = CurrentUploads.get(key);
        if (abortController && abortController.abort) {
            abortController.abort();
        }
    }
}