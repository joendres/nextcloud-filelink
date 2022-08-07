import { CloudAccount } from "../common/cloudaccount.js";

export class AccountUpdater {
    /**
     * Get all accounts from Thunderbird and update each one
     */
    static async update_all() {
        (await browser.cloudFile.getAllAccounts())
            .forEach(account => AccountUpdater._update(account.id));
    }

    /**
     * Setup an account with stored configuration and check if it works.
     * @param {string} accountId The id of the account as supplied by Thunderbird
     */
    static async _update(accountId) {
        const cloud_account = new CloudAccount(accountId);
        await cloud_account.load();
        AccountUpdater.upgradeOldConfiguration(cloud_account);
        if (!!cloud_account.serverUrl && !!cloud_account.username && !!cloud_account.password) {
            await cloud_account.updateFromCloud();
        }
        cloud_account.updateConfigured();
        cloud_account.store();
    }

    /**
     * Older versions of the Add-on might have stored the configuration
     * differently, fix such broken configurations
     * @param {CloudAccount} cloud_account The CloudAccount that might have old
     * configuration options
     */
    static upgradeOldConfiguration(cloud_account) {
        if (cloud_account.serverUrl && !cloud_account.serverUrl.endsWith('/')) {
            cloud_account.serverUrl += '/';
        }
    }
}
