import { Statuses } from "../common/statuses.js";
import { allAbortControllers } from "./eventhandlers.js";
import { Status } from "./status.js";
import { Utils } from "../common/utils.js";

const davUrlBase = "remote.php/dav/files/";

/**
 * This class encapsulates communication with a WebDAV service
 */
export class DavUploader {
    /**
     *
     * @param {string} server_url The URL of the server
     * @param {string} user The username
     * @param {string} password the password
     * @param {string} userid The userid, which might be different from the username
     * @param {string} folder The folder to store attachment
     * @param {number} freeSpace The amount of free space in bytes or -1
     */
    constructor(server_url, user, password, userid, folder, freeSpace = -1) {
        /** @type {string} */
        this.serverurl = server_url;
        /** @type {string} */
        this.storageFolder = folder;
        /** @type {string} */
        this.davUrl = davUrlBase + userid;
        /** @type {number} */
        this.freeSpace = freeSpace;

        this.davHeaders = {
            "Authorization": "Basic " + btoa(user + ':' + password),
            "User-Agent": "Filelink for *cloud/" + browser.runtime.getManifest().version,
            "Content-Type": "application/octet-stream",
        };
    }

    /**
     * Upload one file to the storage folder
     * @param {string} uploadId The id of the upload 
     * @param {string} fileName w/o path
     * @param {File} fileObject the local file as a File object
     * @returns {Promise<Response>}
     */
    async uploadFile(uploadId, fileName, fileObject) {
        const stat = await this.getRemoteFileInfo(fileName);

        if (!stat) {
            // There is no conflicting file in the cloud
            return this.doUpload(uploadId, fileName, fileObject);
        } else {
            // There is a file of the same name
            // The mtime is in milliseconds, but on the cloud it's only accurate to seconds
            if (Math.abs(stat.mtime - fileObject.lastModified) < 1000 &&
                stat.size === fileObject.size) {
                // It's the same as the local file
                return { ok: true, };
            } else {
                // It's different, move it out of the way
                await this.moveFileToDir(uploadId, fileName, "old_shares/" + Math.floor(stat.mtime / 1000));
                return this.doUpload(uploadId, fileName, fileObject);
            }
        }
    }

    //#region Helpers for uploadFile
    /**
     * Create a complete folder path, returns true if that path already exists
     *
     * @param {string} fullPath 
     * @returns {Promise<boolean>} if creation succeeded
     */
    async recursivelyCreateFolder(fullPath) {
        const parts = fullPath.split("/");
        for (let i = 2; i <= parts.length; i++) {
            const folder = parts.slice(0, i).join("/");
            if (!await this.findOrCreateFolder(folder)) {
                return false;
            }
        }
        return true;
    }

    async findOrCreateFolder(folder) {
        let retry_count = 0;
        while (retry_count < 5) {

            const response = await this.doDavCall(folder, 'MKCOL');
            if (!response.status) {
                return false;
            }

            switch (response.status) {
                case 405: // Already exists
                case 201: // Created successfully
                    return true;
                case 423: // Locked
                    // Maybe a parallel upload is currently creating the folder, so wait a little and try again
                    // This timeout is longer in reality because it adds to the waiting time in the queue
                    await promisedTimeout(400 + Math.floor(Math.random() * 200));
                    retry_count++;
                    break;
                default:
                    return false;
            }
        }
        return false;

        /**
         * Create a Promise that resolves after a given timeout
         * @param {number} ms The timeout in milliseconds
         */
        function promisedTimeout(ms) {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        }
    }

    /**
     * Fetches information about a remote file
     * @param {File} file The file to check on the cloud
     * @returns {Promise<?{mtime: Date, size: number}>} A promise resolving to an object containing mtime and
     * size or null if the file doesn't exit
     */
    async getRemoteFileInfo(fileName) {
        const response = await this.doDavCall(this.storageFolder + '/' + fileName, "PROPFIND");
        // something with the right name exists ...
        if (response.ok && response.status < 300) {
            try {
                const xmlDoc = new DOMParser().parseFromString(await response.text(), 'application/xml');
                // ... and it's a file ...
                if (null === xmlDoc.getElementsByTagName("d:resourcetype")[0].firstChild) {
                    return {
                        mtime: (new Date(xmlDoc.getElementsByTagName("d:getlastmodified")[0].textContent)).getTime(),
                        size: parseInt(xmlDoc.getElementsByTagName("d:getcontentlength")[0].textContent),
                    };
                }
            } catch (_) { /* ignore */ }
        }
        return null;
    }

    /**
     * Moves a file to a new destination folder
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName The file's path and name relative to the storage
     * folder
     * @param {string} newPath The new path and name
     * @returns {Promise<Response>} A promise that resolves to the Response object of the DAV request
     * @throws If any problem occurs
     */
    async moveFileToDir(uploadId, fileName, newPath) {
        Status.set_status(uploadId, Statuses.MOVING);
        const dest_header = {
            "Destination":
                this.davUrl + Utils.encodepath(this.storageFolder + "/" + newPath + "/" + fileName),
        };
        if (await this.recursivelyCreateFolder(this.storageFolder + "/" + newPath)) {
            const retval = await this.doDavCall(this.storageFolder + "/" + fileName, "MOVE", null, dest_header);
            if (retval.ok && (retval.status === 201 || retval.status === 204)) {
                return retval;
            }
        }
        Status.fail(uploadId);
        throw new Error("Couldn't move file.");
    }

    /**
     * Set the mtime, so we can later check for identity with local file
     * @param {string} fileName The name of the file to change
     * @param {number} newMtime The mtime to set ont the file as a unix
     * timestamp (seconds)
     */
    setMtime(fileName, newMtime) {
        const body =
            `<d:propertyupdate xmlns:d="DAV:">
                <d:set>
                    <d:prop>
                        <d:lastmodified>${newMtime}</d:lastmodified>
                    </d:prop>
                </d:set>
            </d:propertyupdate>`;

        this.doDavCall(this.storageFolder + '/' + fileName, "PROPPATCH", body);
        // Ignore errors, because that might only trigger re-upload
    }

    /**
     *
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName The name in the cloud
     * @param {File} fileObject The File object to upload
     * @returns {Promise<Response>} A Promise that resolves to the http response
     */
    async doUpload(uploadId, fileName, fileObject) {
        // Check it there is enough free space
        Status.set_status(uploadId, Statuses.CHECKINGSPACE);
        if (this.freeSpace !== -1 && this.freeSpace < fileObject.size) {
            Status.fail(uploadId);
            return { ok: false, };
        }

        // Make sure storageFolder exists. Creation implicitly checks for
        // existence of folder, so the extra webservice call for checking first
        // isn't necessary.
        Status.set_status(uploadId, Statuses.CREATING);
        if (!(await this.recursivelyCreateFolder(this.storageFolder))) {
            Status.fail(uploadId);
            throw new Error("Upload failed: Can't create folder");
        }

        let response;
        try {
            response = await this.xhrUpload(uploadId, this.storageFolder + '/' + fileName, fileObject);
            this.setMtime(fileName, Math.floor(fileObject.lastModified / 1000));
            // Handle errors that don't throw an exception
            if (response.status < 300) {
                response.ok = true;
            }
        } catch (error) {
            if (error.type === 'abort') {
                response = { aborted: true, };
            } else {
                Status.fail(uploadId);
                console.error(error); // jshint ignore: line
                if (!response) {
                    response = {};
                }
                response.ok = false;
            }
        }
        allAbortControllers.delete(uploadId);
        return response;
    }
    // #endregion

    /**
     * Calls one function of the WebDAV service
     *
     * @param {string} path the full file path of the object
     * @param {string} method the HTTP METHOD to use, default GET
     * @param {string} [body] Body of the request, eg. file contents
     * @param {{string,string}} [additional_headers] Additional headers to include in the request
     * @returns {Promise<Response>}  A Promise that resolves to the Response object
     */
    async doDavCall(path, method, body, additional_headers = {}) {
        let url = this.serverurl;
        url += this.davUrl;
        url += Utils.encodepath(path);

        const headers = this.davHeaders;
        for (const name in additional_headers) {
            headers[name] = additional_headers[name];
        }

        let fetchInfo = {
            method,
            headers,
            credentials: "omit",
        };

        if (body) {
            fetchInfo.body = body;
        }

        try {
            return await fetch(url, fetchInfo);
        } catch (error) {
            console.error(error); // jshint ignore: line
            return { ok: false, };
        }
    }

    /**
     * 
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} path The path the file will be uploaded to
     * @param {Blob} data The file content (as a File object)
     * @returns {Promise} A promise that resolves to the XHR or rejects with the entire event
     */
    async xhrUpload(uploadId, path, data) {
        let url = this.serverurl;
        url += this.davUrl;
        url += Utils.encodepath(path);

        // Remove session password as it interferes with credentials 
        await browser.cookies.remove({ url, name: "oc_sessionPassphrase", firstPartyDomain: "", });

        return new Promise((resolve, reject) => {
            const uploadRequest = new XMLHttpRequest();

            uploadRequest.addEventListener("load", e => {
                if (e.target.status < 300) {
                    resolve(e.target);
                } else {
                    reject(e);
                }
            });

            uploadRequest.addEventListener("error", reject);
            uploadRequest.addEventListener("abort", reject);
            uploadRequest.addEventListener("timeout", reject);

            uploadRequest.addEventListener("loadstart", () => Status.set_status(uploadId, Statuses.UPLOADING));
            uploadRequest.upload.addEventListener("progress", e => {
                Status.set_progress(uploadId, e.total ? e.loaded * 1.0 / e.total : 0);
            });

            uploadRequest.open("PUT", url);
            for (const key in this.davHeaders) {
                uploadRequest.setRequestHeader(key, this.davHeaders[key]);
            }

            allAbortControllers.set(uploadId, uploadRequest);
            uploadRequest.send(data);
        });
    }
}
