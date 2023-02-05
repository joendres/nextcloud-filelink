// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Statuses } from "./statuses.js";

/**
 * Class to hold status of one upload
 */
export class UploadStatus {
    /**
     * @param {string} filename The name of the file to upload
     */
    constructor(filename) {
        /** @type {string} */
        this.filename = filename;
        /** @type {string} */
        this.status = Statuses.PREPARING;
        /** @type {number} */
        this.progress = 0;
        /** @type {boolean} Has an error occurred? */
        this.error = false;
    }
}