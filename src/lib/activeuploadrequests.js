// SPDX-FileCopyrightText: 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/** XMLHttpRequests for all active uploads, indexed by uploadId. These are
 * needed to abort the uploads upon request 
 * @type {Object<string, XMLHttpRequest>}
 */
export const activeUploadRequests = {};
