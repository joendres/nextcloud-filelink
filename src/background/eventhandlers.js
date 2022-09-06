import { CloudAccount } from "../common/cloudaccount.js";
import { CloudUploader } from "./clouduploader.js";
import { CurrentUploads } from "./currentuploads.js";
import { Status } from "./status.js";

/**
 * High level handlers for the cloudFile events
 */
export class EventHandlers {
    /**
     * Called when a file should be uploaded to the cloud file provider
     * @param {browser.cloudFile.CloudFileAccount} account The account used for the file upload
     * @param {browser.cloudFile.CloudFile} fileInfo The file to upload
     * @returns {Promise<{url:string, aborted:boolean}>} The URL where the
     * uploaded file can be accessed and info if the file upload was aborted by
     * the user
     */
    static async onFileUpload(account, { id, name, data }) {
        const uploader = new CloudUploader(account.id);
        await uploader.load();
        return uploader.uploadFile(makeUploadId(account, id), name, data);
    }

    /**
     * Called when the user chooses aborts an upload. Abort the upload.
     * @param {browser.cloudFile.CloudFileAccount} account The account used for the file upload
     * @param {number} fileId An identifier for this file
     */
    static onFileUploadAbort(account, fileId) {
        const uploadId = makeUploadId(account, fileId);
        const abortController = CurrentUploads.get(uploadId);
        if (abortController) {
            abortController.abort();
        }
        Status.remove(uploadId);
    }

    /**
     * Called when a previously uploaded file should be deleted. *cloud ignores it to reuse previous uploads
     * @param {browser.cloudFile.CloudFileAccount} account The account used for the file upload
     * @param {number} fileId An identifier for this file
     */
    static onFileDeleted(account, fileId) {
        Status.remove(makeUploadId(account, fileId));
    }

    /**
     * Called when a cloud file account of this add-on was created
     * @param {browser.cloudFile.CloudFileAccount} account The created account
     */
    static async onAccountAdded(account) {
        const cloud_account = new CloudAccount(account.id);
        cloud_account.setDefaults();
        await cloud_account.store();
    }

    /**
     * Called when a cloud file account of this add-on was deleted
     * @param {string} accountId The id of the removed account
     */
    static onAccountDeleted(accountId) {
        new CloudAccount(accountId).delete();
    }
}

/**
 * The fileId is only unique within one account. makeUploadId creates a unique
 * string that identifies the upload even if more than one account is active.
 * @param {browser.cloudFile.CloudFileAccount} account The CloudFileAccount as supplied by Thunderbird
 * @param {number} fileId The fileId supplied by Thunderbird
 */
function makeUploadId(account, fileId) {
    return `${account.id}_${fileId}`;
}
