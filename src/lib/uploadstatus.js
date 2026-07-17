// SPDX-FileCopyrightText: (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * The allowed status values for an upload.
 * @enum {string}
 */
const STATUS = Object.freeze({
    /** Preparing the upload (e.g. reading file metadata) */
    PREPARING: 'preparing',
    /** Verifying that the file does not exceed the size limit */
    CHECKINGSIZE: 'checkingsize',
    /** Verifying that the server has enough free space */
    CHECKINGSPACE: 'checkingspace',
    /** Creating the upload folder on the server */
    CREATING: 'creating',
    /** Moving a conflicting file out of the way */
    MOVING: 'moving',
    /** Transferring file data to the server */
    UPLOADING: 'uploading',
    /** Creating a share link on the server */
    SHARING: 'sharing',
    /** Upload complete; a download password has been generated */
    HASPASSWORD: 'generatedpassword',
});

/**
 * Class to store and query the status of uploads
 */
class UploadStatus {

    /**
     * Status information about one upload 
     * @typedef {Object} Status
     * @property {string} filename The file that is uploaded
     * @property {number} progress The upload progress, a number between 0 and 1
     * @property {boolean} error Did the upload fail?
     * @property {string} status One of the status values defined in STATUS
     * @property {string} password The download password if one was set
     */

    /**
     * Store one status object
     * @param {string} uploadId The unique ID of the upload
     * @param {Status} status The status of that upload
     */
    static async #store(uploadId, status) {
        return browser.storage.session.set({ [uploadId]: status });
    }
    /**
     * Create a new status entry for an upload and store it in session storage.
     * Also updates the badge to reflect the new total number of active uploads.
     * @param {string} uploadId The unique ID of the upload
     * @param {string} filename The name of the file being uploaded
     */
    static async create(uploadId, filename) {
        await UploadStatus.#store(uploadId, {
            filename,
            progress: 0,
            error: false,
            status: undefined,
        });
        return UploadStatus.updateBadge();
    }

    /**
     * Load the status of an upload from storage
     * @param {string} uploadId The unique ID of the upload
     * @returns {Promise<Status>|undefined} A Promise that resolves to the Status object of the upload or undefined, if there was no such object in storage
     */
    static async #load(uploadId) {
        const o = await browser.storage.session.get(uploadId);
        return o[uploadId];
    }

    /**
     * Get all the status object for all current uploads
     * @returns {Promise<{ [uploadId: string]: Status}>} An object indexed by uploadId
     */
    static async getAll() {
        return browser.storage.session.get();
    }

    /**
     * Update the status of an upload with values from an object
     * @param {string} uploadId The unique ID of the upload
     * @param {Status} new_status Object containing the new properties. Only properties present in this object are changed, all others stay the same
     */
    static async #update(uploadId, new_status) {
        const status = await UploadStatus.#load(uploadId);
        if (status) {
            for (const key in new_status) {
                status[key] = new_status[key];
            }
            UploadStatus.#store(uploadId, status);
        }
    }

    /**
     * Store the status property of a status object
     * @param {string} uploadId The unique ID of the upload
     * @param {string} status One of the status values defined in STATUS
     */
    static async #setStatus(uploadId, status) {
        return UploadStatus.#update(uploadId, { status, });
    }

    /**
     * Mark an upload as preparing (e.g. reading file metadata).
     * @param {string} uploadId The unique ID of the upload
     */
    static async preparing(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.PREPARING);
    }
    /**
     * Mark an upload as creating its folder on the server.
     * @param {string} uploadId The unique ID of the upload
     */
    static async creating(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.CREATING);
    }
    /**
     * Mark an upload as moving a conflicting file out of the way.
     * @param {string} uploadId The unique ID of the upload
     */
    static async moving(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.MOVING);
    }
    /**
     * Mark an upload as actively transferring file data.
     * @param {string} uploadId The unique ID of the upload
     */
    static async uploading(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.UPLOADING);
    }
    /**
     * Mark an upload as creating a share link on the server.
     * @param {string} uploadId The unique ID of the upload
     * @returns {Promise<void>}
     */
    static async sharing(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.SHARING);
    }
    /**
     * Mark an upload as verifying that the file does not exceed the size limit.
     * @param {string} uploadId The unique ID of the upload
     * @returns {Promise<void>}
     */
    static async checkingsize(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.CHECKINGSIZE);
    }
    /**
     * Mark an upload as verifying that the server has enough free space.
     * @param {string} uploadId The unique ID of the upload
     * @returns {Promise<void>}
     */
    static async checkingspace(uploadId) {
        return UploadStatus.#setStatus(uploadId, STATUS.CHECKINGSPACE);
    }

    /**
     * Update the progress of a running upload.
     * @param {string} uploadId The unique ID of the upload
     * @param {number} progress A number between 0 and 1
     */
    static async progress(uploadId, progress) {
        return UploadStatus.#update(uploadId, { progress, });
    }

    /**
     * Store the download password for a completed upload.
     * @param {string} uploadId The unique ID of the upload
     * @param {string} password The download password
     */
    static async password(uploadId, password) {
        return UploadStatus.#update(uploadId, {
            password,
            status: STATUS.HASPASSWORD,
        });
    }

    /**
     * Check whether a download password has been set for an upload.
     * @param {string} uploadId The unique ID of the upload
     * @returns {Promise<boolean>} Resolves to true if the upload has a download password
     */
    static async hasPassword(uploadId) {
        const status = await UploadStatus.#load(uploadId);
        return status.status === STATUS.HASPASSWORD;
    }

    /**
     * Mark an upload as failed.
     * @param {string} uploadId The unique ID of the upload
     */
    static async fail(uploadId) {
        return UploadStatus.#update(uploadId, { error: true });
    }

    /**
     * Remove an upload's status entry from session storage.
     * Also updates the badge to reflect the new total number of active uploads.
     * @param {string} uploadId The unique ID of the upload
     */
    static async remove(uploadId) {
        await browser.storage.session.remove(uploadId);
        return UploadStatus.updateBadge();
    }

    /**
     * Remove all status objects of uploads that have already completed
     * (i.e. those with a download password or a failed status).
     * @returns {Promise<void>}
     */
    static async clearComplete() {
        const allStatus = await UploadStatus.getAll();
        for (const uploadId in allStatus) {
            const status = allStatus[uploadId];

            if (status.error || status.status === STATUS.HASPASSWORD) {
                UploadStatus.remove(uploadId);
            }
        }
        // No need to updateBadge as remove already does that
    }

    /**
     * Update the badge on the cloud status button to show the number of
     * active uploads. Clears the badge when there are no active uploads.
     * @returns {Promise<void>}
     */
    static async updateBadge() {
        const allStatus = await UploadStatus.getAll();
        const messages = Object.keys(allStatus).length.toString();

        messenger.composeAction.setBadgeText({ text: messages !== "0" ? messages : null, });
    }
}

export { UploadStatus, STATUS };
