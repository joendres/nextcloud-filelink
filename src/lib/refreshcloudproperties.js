// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CloudCapabilities } from "./cloudcapabilities.js";
import { CloudConnection } from "./cloudconnection.js";
import { getFaviconUrl } from "./getFaviconUrl.js";

/**
 * Fetch capabilities, favIcon and free space from the cloud and store them in
 * account and the corresponding capabilities.
 *
 * @param {import('./account.js').Account} account
 * @param {CloudCapabilities|undefined} capabilities If undefined the function will get the CloudCapabilities that belong to the account
 * @param {boolean} [getAppPassword=false] Try to convert password to an app token
 * @returns {Promise<string|undefined>} Error status if something failed,
 * otherwise undefined
 */
async function refreshCloudProperties(account, capabilities, getAppPassword = false) {
    const cc = new CloudConnection(account);

    const serverData = await cc.getCapabilities();
    if ("string" === typeof serverData) {
        // Error status
        await account.usable(false);
        return serverData;
    }

    capabilities ??= await CloudCapabilities.get(account.accountId);

    await capabilities.updateAndStore(serverData);

    // Give Thunderbird a chance to parallelize the fetch calls
    const [
        userIdData,
        faviconUrls,
        appToken,
    ] = await Promise.all([
        cc.getUserId(),
        getFaviconUrl(capabilities, account.serverUrl),
        getAppPassword ? cc.getAppPassword() : undefined,
    ]);

    const accountUpdates = { userId: userIdData.id, };
    if (appToken) { accountUpdates.password = appToken; }

    await account.updateAndStore(accountUpdates);
    await capabilities.updateAndStore(faviconUrls);
    await account.updateConfigured(capabilities);

    return undefined === userIdData.id ? userIdData.status : undefined;
}

export { refreshCloudProperties }