import { CloudAccount } from "../common/cloudconnection.js";

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
        const ncc = new CloudAccount(accountId);
        await ncc.load();
        AccountUpdater.upgradeOldConfiguration(ncc);
        if (!!ncc.serverUrl && !!ncc.username && !!ncc.password) {
            await ncc.updateFromCloud();
        }
        ncc.updateConfigured();
        ncc.store();
    }

    /**
     * Older versions of the Add-on might have stored the configuration
     * differently, fix such broken configurations
     * @param {CloudAccount} ncc The CloudAccount that might have old
     * configuration options
     */
    static upgradeOldConfiguration(ncc) {
        if (ncc.serverUrl && !ncc.serverUrl.endsWith('/')) {
            ncc.serverUrl += '/';
        }
    }
}
