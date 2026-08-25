// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { UploadStatus } from "../lib/uploadstatus.js";
import { CloudConnection } from "../lib/cloudconnection.js";
import { activeUploadRequests } from "../lib/activeuploadrequests.js";
import { DistributionPolicy } from "./distributionpolicy.js";
import { Account } from "../lib/account.js";
import { makeUploadId } from "../lib/storagelayout.js";
import { CloudCapabilities } from "../lib/cloudcapabilities.js";
import { refreshCloudProperties } from "../lib/refreshcloudproperties.js";

(async () => {
    const allAccounts = await messenger.cloudFile.getAllAccounts();
    for (const cloudFileAccount of allAccounts) {
        updateAccount(cloudFileAccount.id);
    }
})();

messenger.cloudFile.onFileUpload.addListener(async (cloudFileAccount, { id, name, data }) => {
    const a = await Account.get(cloudFileAccount.id);
    const ncc = new CloudConnection(a);
    return ncc.uploadFile(makeUploadId(cloudFileAccount, id), name, data);
});

messenger.cloudFile.onFileUploadAbort.addListener((cloudFileAccount, fileId) => {
    const uploadId = makeUploadId(cloudFileAccount, fileId);
    activeUploadRequests[uploadId]?.abort();
    UploadStatus.remove(uploadId);
});

/** Don't delete any files because we want to reuse uploads.  */
messenger.cloudFile.onFileDeleted.addListener((cloudFileAccount, fileId) => {
    UploadStatus.remove(makeUploadId(cloudFileAccount, fileId));
});

messenger.cloudFile.onAccountAdded.addListener(cloudFileAccount => {
    const account = new Account(cloudFileAccount.id);
    account.setDefaultsAndStore();
});

messenger.cloudFile.onAccountDeleted.addListener(accountId => {
    CloudCapabilities.remove(accountId);
    Account.remove(accountId);
});

async function updateAccount(accountId) {

    const account = await Account.get(accountId);
    upgradeOldConfiguration(account);

    // Set preferences from enterprise policies, if this is a managed account.
    // Other accounts stay unchanged.
    await DistributionPolicy.configure(account);
    // Set defaults for the properties not yet configured
    await account.setDefaultsAndStore();

    if (account.hasLoginData()) {
        refreshCloudProperties(account);
    }
}

/**
 * If the settings were stored by an older version of the Add-on and the
 * format has changed, upgrade them
 * @param {Account} account 
 */
function upgradeOldConfiguration(account) {
    if (account.serverUrl && !account.serverUrl.endsWith('/')) {
        account.serverUrl += '/';
    }
}
