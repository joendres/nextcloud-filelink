// SPDX-FileCopyrightText: 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Applies distribution policy (managed storage) configuration to a CloudConnection.
 *
 * Administrators can pre-configure accounts via the browser's managed storage
 * (e.g. via Group Policy or an enterprise policy file). This class reads those
 * values and writes them into the CloudConnection, overriding any user-set values.
 */
class DistributionPolicy {
    /**
     * The CloudConnection properties that may be set via managed storage,
     * mapped to their expected types. Only these keys are applied.
     * @type {Object.<string, string>}
     */
    static allowedFieldTypes = {
        serverUrl: 'string',
        username: 'string',
        password: 'string',
        storageFolder: 'string',
    };

    /**
     * Reads the managed storage policy for the given account and applies any
     * configured fields to the CloudConnection.
     *
     * If no policy exists for this account, the CloudConnection is returned unchanged.
     *
     * @param {CloudConnection} cc The connection object to configure
     * @returns {Promise<CloudConnection>} The same connection object, with policy values applied
     */
    static async configure(cc) {
        let policyAccounts;
        try {
            policyAccounts = await browser.storage.managed.get("accounts");
        } catch (_) {
            return cc;
        }
        const policyData = policyAccounts?.accounts?.[cc._accountId];

        if (policyData) {
            const lockedSettings = [];

            for (const key in policyData) {
                if (key in DistributionPolicy.allowedFieldTypes) {
                    switch (policyData[key].Status) {
                        case "locked":
                            // Overwrite if locked
                            cc[key] = policyData[key].Value;
                            lockedSettings.push(key);
                            break;
                        case "clear":
                            delete cc[key];
                            break;
                        default:
                            // Only set it, if there is not yet a value
                            cc[key] ??= policyData[key].Value;
                            break;
                    }
                }
            }
            cc.lockedSettings = lockedSettings;
        }
        return cc;
    }
}

export { DistributionPolicy };