export class CurrentUploads {
    /**
     * Stores an XMLHttpRequest
     * @param {string} key The id of the upload
     * @param {XMLHttpRequest} value The XMLHttpRequest for this upload
     */
    static add(key, value) {
        if (!CurrentUploads.map) {
            CurrentUploads.map = new Map();
        }
        CurrentUploads.map.set(key, value);
    }

    /**
     * Removes the XMLHttpRequest of an upload
     * @param {string} key The id of the upload
     */
    static remove(key) {
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
        return CurrentUploads.map.get(key);
    }

    /**
     * Aborts an upload
     * @param {string} key The id of the upload
     */
    static abort(key) {
        /** @type {XMLHttpRequest} */
        const request = CurrentUploads.get(key);
        if (request && request.abort) {
            request.abort();
        }
    }
}