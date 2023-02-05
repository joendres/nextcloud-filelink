// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Statuses } from "../common/statuses.js";
import { UploadStatus } from "../common/uploadstatus.js";

export class Status {
    /** 
     * Singleton that holds the statuses of all uploads
     * @type {Map<string,UploadStatus>}
     */
    static get attachmentStatus() {
        if (!Status._attachmentStatus) {
            Status._attachmentStatus = new Map();
        }
        return Status._attachmentStatus;
    }

    /**
     * Add a new upload to the list
     * @param {string} uploadId The id of the upload
     * @param {string} fileName The name of the file that is uploaded
     */
    static add(uploadId, fileName) {
        Status.attachmentStatus.set(uploadId, new UploadStatus(fileName));
    }

    /**
     * Set new status, possible values defined in statuses.js
     * @param {string} uploadId The id of the upload that changed its status
     * @param {string} s The new status
     */
    static set_status(uploadId, s) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (upload) {
            upload.status = s;
            Status.update();
        }
    }

    /**
     * Set the upload status to error state
     * @param {string} uploadId The id of the upload that changed its status
     */
    static fail(uploadId) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (upload) {
            upload.error = true;
            Status.update();
        }
    }

    /**
     * Update the upload progress
     * @param {number} p Fraction of data already transferred as a float
     * @param {string} uploadId The id of the upload that changed its status
     */
    static set_progress(uploadId, p) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (upload) {
            upload.progress = p;
            Status.update();
        }
    }

    /**
     * Store the download password for this file in the status list
     * @param {string} uploadId The id of the upload that changed its status
     * @param {string} pw The download password
     */
    static set_password(uploadId, pw) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (upload) {
            upload.password = pw;
            Status.update();
        }
    }

    /**
     * The upload is done. If it didn't fail or has a download password, remove it from the list
     * @param {string} uploadId The id of the upload that changed its status
     */
    static done(uploadId) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (upload && true !== upload.error && Statuses.GENERATEDPASSWORD !== upload.status) {
            Status.remove(uploadId);
        }
    }

    /**
     * Update badge and send status to status popup, if it's listening (open)
     */
    static async update() {
        const messages = Status.attachmentStatus.size.toString();
        browser.composeAction.setBadgeText({ text: messages !== "0" ? messages : null, });
        if (Status.port) {
            Status.port.postMessage(Status.attachmentStatus);
        }
    }

    /**
     * Remove one upload from the status map
     * @param {string} uploadId The id of the upload created in background.js
     */
    static async remove(uploadId) {
        Status.attachmentStatus.delete(uploadId);
        Status.update();
    }

    /**
     * Remove all uploads from the list, that are done, didn't fail and don't have a download password
     */
    static clearcomplete() {
        Status.attachmentStatus.forEach(
            (v, k, m) => {
                if (true === v.error || Statuses.GENERATEDPASSWORD === v.status) {
                    m.delete(k);
                }
            });
        Status.update();
    }
}
