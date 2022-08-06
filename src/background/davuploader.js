import { allAbortControllers } from "./eventhandlers.js";
import { Status } from "./status.js";
import { Utils } from "./utils.js";

/**
 * This class encapsulates communication with a WebDAV service
 */
export class DavUploader {
    /**
     *
     * @param {string} server_url The URL of the server
     * @param {string} user The username
     * @param {string} password the password
     * @param {string} dav_url The url path to the webdav service
     * @param {string} folder The folder to store attachment
     * @param {number} freeSpace The amount of free space in bytes or -1
     */
    constructor(server_url, user, password, dav_url, folder, freeSpace = -1) {
        this._serverurl = server_url;
        this._storageFolder = folder;
        this._davUrl = dav_url;
        this._freeSpace = freeSpace;

        const manifest = browser.runtime.getManifest();
        this._davHeaders = {
            "Authorization": "Basic " + btoa(user + ':' + password),
            "User-Agent": "Filelink for *cloud/" + manifest.version,
            "Content-Type": "application/octet-stream",
        };
    }

    /**
     * Upload one file to the storage folder
     *
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName w/o path
     * @param {File} fileObject the local file as a File object
     * @returns {Promise<Response>}
     */
    async uploadFile(uploadId, fileName, fileObject) {
        const stat = await this._getRemoteFileInfo(fileName);

        if (!stat) {
            // There is no conflicting file in the cloud
            return this._doUpload(uploadId, fileName, fileObject);
        } else {
            // There is a file of the same name
            // The mtime is in milliseconds, but on the cloud it's only accurate to seconds
            if (Math.abs(stat.mtime - fileObject.lastModified) < 1000 &&
                stat.size === fileObject.size) {
                // It's the same as the local file
                return { ok: true, };
            } else {
                // It's different, move it out of the way
                await this._moveFileToDir(uploadId, fileName, "old_shares/" + (stat.mtime / 1000 | 0));
                return this._doUpload(uploadId, fileName, fileObject);
            }
        }
    }

    //#region Helpers for uploadFile
    /**
     * Create a complete folder path, returns true if that path already exists
     *
     * @param {string} fullPath 
     * @returns {boolean} if creation succeeded
     */
    async _recursivelyCreateFolder(fullPath) {
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

            const response = await this._doDavCall(folder, 'MKCOL');
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
                    await Utils.promisedTimeout(400 + Math.floor(Math.random() * 200));
                    retry_count++;
                    break;
                default:
                    return false;
            }
        }
        return false;
    }

    /**
     * Fetches information about a remote file
     * @param {File} file The file to check on the cloud
     * @returns {Promise<?{mtime: Date, size: number}>} A promise resolving to an object containing mtime and
     * size or null if the file doesn't exit
     */
    async _getRemoteFileInfo(fileName) {
        const response = await this._doDavCall(this._storageFolder + '/' + fileName, "PROPFIND");
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
            } catch (_) { }
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
    async _moveFileToDir(uploadId, fileName, newPath) {
        Status.set_status(uploadId, 'moving');
        const dest_header = {
            "Destination":
                this._davUrl + Utils.encodepath(this._storageFolder + "/" + newPath + "/" + fileName),
        };
        if (await this._recursivelyCreateFolder(this._storageFolder + "/" + newPath)) {
            const retval = await this._doDavCall(this._storageFolder + "/" + fileName, "MOVE", null, dest_header);
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
    _setMtime(fileName, newMtime) {
        const body =
            `<d:propertyupdate xmlns:d="DAV:">
                <d:set>
                    <d:prop>
                        <d:lastmodified>${newMtime}</d:lastmodified>
                    </d:prop>
                </d:set>
            </d:propertyupdate>`;

        this._doDavCall(this._storageFolder + '/' + fileName, "PROPPATCH", body);
        // Ignore errors, because that might only trigger re-upload
    }

    /**
     *
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} fileName The name in the cloud
     * @param {File} fileObject The File object to upload
     * @returns {Promise<Response>} A Promise that resolves to the http response
     */
    async _doUpload(uploadId, fileName, fileObject) {
        // Check it there is enough free space
        Status.set_status(uploadId, 'checkingspace');
        if (this._freeSpace !== -1 && this._freeSpace < fileObject.size) {
            Status.fail(uploadId);
            return { ok: false, };
        }

        // Make sure storageFolder exists. Creation implicitly checks for
        // existence of folder, so the extra webservice call for checking first
        // isn't necessary.
        Status.set_status(uploadId, 'creating');
        if (!(await this._recursivelyCreateFolder(this._storageFolder))) {
            Status.fail(uploadId);
            throw new Error("Upload failed: Can't create folder");
        }

        let response;
        try {
            response = await this._xhrUpload(uploadId, this._storageFolder + '/' + fileName, fileObject);
            this._setMtime(fileName, fileObject.lastModified / 1000 | 0);
            // Handle errors that don't throw an exception
            if (response.status < 300) {
                response.ok = true;
            }
        } catch (error) {
            if (error.type === 'abort') {
                response = { aborted: true, url: "", };
            }
            else {
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
    }    //#endregion

    /**
     * Calls one function of the WebDAV service
     *
     * @param {string} path the full file path of the object
     * @param {string} method the HTTP METHOD to use, default GET
     * @param {array} [body] Body of the request, eg. file contents
     * @param {*} [additional_headers] Additional headers to include in the request
     * @returns {Promise<Response>}  A Promise that resolves to the Response object
     */
    _doDavCall(path, method, body, additional_headers) {
        let url = this._serverurl;
        url += this._davUrl;
        url += Utils.encodepath(path);

        let fetchInfo = {
            method,
            headers: additional_headers ? { ...this._davHeaders, ...additional_headers, } : this._davHeaders,
            credentials: "omit",
        };

        if (body) {
            fetchInfo.body = body;
        }

        return fetch(url, fetchInfo).
            catch(error => {
                console.error(error); // jshint ignore: line
                return { ok: false, };
            });
    }

    /**
     * 
     * @param {string} uploadId The id of the upload created in background.js
     * @param {string} path The path the file will be uploaded to
     * @param {Blob} data The file content (as a File object)
     * @returns {Promise} A promise that resolves to the XHR or rejects with the entire event
     */
    async _xhrUpload(uploadId, path, data) {
        let url = this._serverurl;
        url += this._davUrl;
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

            uploadRequest.addEventListener("loadstart", () => Status.set_status(uploadId, 'uploading'));
            uploadRequest.upload.addEventListener("progress", e => {
                Status.set_progress(uploadId, e.total ? e.loaded * 1.0 / e.total : 0);
            });

            uploadRequest.open("PUT", url);
            for (const key in this._davHeaders) {
                uploadRequest.setRequestHeader(key, this._davHeaders[key]);
            }

            allAbortControllers.set(uploadId, uploadRequest);
            uploadRequest.send(data);
        });
    }
}
