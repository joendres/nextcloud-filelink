// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { UploadStatus } from "./lib/uploadstatus.js";
import { CloudConnection } from "./lib/cloudconnection.js";
import { activeUploadRequests } from "./lib/activeuploadrequests.js";
import { DistributionPolicy } from "./lib/distributionpolicy.js";

messenger.cloudFile.getAllAccounts()
    .then(
        allAccounts => {
            allAccounts.forEach(account => updateAccount(account.id));
        });

messenger.cloudFile.onFileUpload.addListener(async (account, { id, name, data }) => {
    const ncc = new CloudConnection(account.id);
    await ncc.load();
    return ncc.uploadFile(makeUploadId(account, id), name, data);
});

messenger.cloudFile.onFileUploadAbort.addListener(
    (account, fileId) => {
        const uploadId = makeUploadId(account, fileId);
        const abortController = activeUploadRequests[uploadId];
        if (abortController) {
            abortController.abort();
        }
        UploadStatus.remove(uploadId);
    });

/** Don't delete any files because we want to reuse uploads.  */
messenger.cloudFile.onFileDeleted.addListener(
    (account, fileId) => {
        UploadStatus.remove(makeUploadId(account, fileId));
    });

messenger.cloudFile.onAccountAdded.addListener(async account => {
    const ncc = new CloudConnection(account.id);
    await ncc.load();
    ncc.setDefaults();
    await ncc.store();
});

messenger.cloudFile.onAccountDeleted.addListener(accountId => {
    const ncc = new CloudConnection(accountId);
    ncc.deleteAccount();
});

async function updateAccount(accountId) {
    const ncc = new CloudConnection(accountId);
    await ncc.load();

    // Set preferences from enterprise policies, if this is a managed account.
    // Other accounts stay unchanged.
    await DistributionPolicy.configure(ncc);

    // Make sure the necessary settings are present. Does not overwrite
    // existing values.
    ncc.setDefaults();

    upgradeOldConfigurations();

    if (ncc.hasLoginData()) {
        // Check if login works
        const answer = await ncc.updateUserId();
        ncc.laststatus = null;
        if (answer._failed) {
            ncc.laststatus = answer.status;
        } else {
            await Promise.all([ncc.updateFreeSpaceInfo(), ncc.updateCapabilities(),]);
            await ncc.updateConfigured();
        }
    }
    ncc.store();

    function upgradeOldConfigurations() {
        if (ncc.serverUrl && !ncc.serverUrl.endsWith('/')) {
            ncc.serverUrl += '/';
        }
    }
}

/**
 * The fileId is only unique within one account. makeUploadId creates a string
 * that identifies the upload even if more than one account is active.
 * @param {CloudFileAccount} account The CloudFileAccount as supplied by Thunderbird
 * @param {number} fileId The fileId supplied by Thunderbird
 */
function makeUploadId(account, fileId) {
    return `${account.id}_${fileId}`;
}
