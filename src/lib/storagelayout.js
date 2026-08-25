// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

// Technically the account.id can contain any character, but according to
// source/modules/libpref/docs/index.md in the Firefox code base a dot is
// highly unlikely. Use it here, so the markers can't collide with an
// account.id when used as keys in session storage.

const STARTMARKS = {
    UPLOAD: '.u.',
    CAPABILITIES: '.c.',
};

// Key format for UploadStatus

/**
 * The fileId is only unique within one account. makeUploadId creates a string
 * that identifies the upload even if more than one account is active.
 * @param {CloudFileAccount} account The CloudFileAccount as supplied by Thunderbird
 * @param {number} fileId The fileId supplied by Thunderbird
 */
function makeUploadId(account, fileId) {
    return `${STARTMARKS.UPLOAD}${account.id}.${fileId}`;
}

/**
 * Does the string match the format of an uploadId?
 * @param {string} key A string that might be an uploadId
 */
function isUploadId(key) {
    return key.startsWith(STARTMARKS.UPLOAD);
}

// Key format for CloudCapabilities
/**
 * A unique key for storage.session
 * @param {string} accountId 
 */
function capabilitiesStorageKey(accountId) {
    return STARTMARKS.CAPABILITIES + accountId;
}

export { makeUploadId, isUploadId, capabilitiesStorageKey }