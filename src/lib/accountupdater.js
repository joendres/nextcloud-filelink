class AccountUpdater {
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
        const ncc = new CloudConnection(accountId);
        await ncc.load();
        AccountUpdater.upgradeOldConfiguration(ncc);

        // Check if login works
        const answer = await ncc.updateUserId();
        ncc.laststatus = null;
        if (answer._failed) {
            ncc.laststatus = answer.status;
        } else {
            await Promise.all([ncc.updateFreeSpaceInfo(), ncc.updateCapabilities(),]);
            // Needs result of updateCapabilities
            await ncc.updateConfigured();
        }
        ncc.store();
    }

    /**
     * Older versions of the Add-on might have stored the configuration
     * differently, fix such broken configurations
     * @param {CloudConnection} ncc The CloudConnection that might have old
     * configuration options
     */
    static upgradeOldConfiguration(ncc) {
        if (ncc.serverUrl && !ncc.serverUrl.endsWith('/')) {
            ncc.serverUrl += '/';
        }
    }
}

/* Make jshint happy */
/* global CloudConnection */
/* exported AccountUpdater */