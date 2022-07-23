export class HeaderHandler {

    /**
     * Update the free space info
     * @param {string} accountId The id of the account the dialog is handling, as supplied by TB
     */
    static async updateFreespace(accountId) {
        let theAccount = await messenger.cloudFile.getAccount(accountId);
        const freespaceinfo = document.querySelector("#freespaceinfo");

        freespaceinfo.hidden = true;
        const free = parseInt(theAccount.spaceRemaining);
        const full = free + parseInt(theAccount.spaceUsed);

        if (free >= 0 && full >= 0 &&
            free <= Number.MAX_SAFE_INTEGER && full <= Number.MAX_SAFE_INTEGER &&
            isFinite(free) && isFinite(full)) {
            const freespacelabel = document.querySelector("#freespacelabel");
            const freespace = document.querySelector("#freespace");

            freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                HeaderHandler.humanReadable(free),
                HeaderHandler.humanReadable(full),]);

            freespace.max = full;
            freespace.value = free;
            freespace.low = Math.floor(full / 20);
            freespaceinfo.hidden = false;
        }
    }

    /**
     * Turn a number of bytes into a human readable string like 1.5MB
     * @param {number} bytes The number to display
     * @returns {string}
     */
    static humanReadable(bytes) {
        const units = ["B", "kB", "MB", "GB", "TB", "PB", "EB",];
        let n = bytes;
        let s = "";
        let i = -1;
        do {
            s = n.toPrecision(3);
            n /= 1000;
            if (i++ >= units.length) {
                // Should never happen as log10(MAX_SAFE_INTEGER) < 16
                return "NaN";
            }
        } while (s.match(/e/));
        // @todo set decimal point sign according to language
        return s.replace(/(\.\d+)0$/, "$1").replace(/\.0$/, "") + units[i];
    }

    /**
     * Show the name, type and version of the cloud
     * @param {CloudConnection} cc The Cloudconnection linked to the currently
     * open dialog
     */
    static updateCloudVersion(cc) {
        const logo = document.querySelector("#logo");
        const label_version = document.querySelector("#label_version");
        const provider_name = document.querySelector("#provider_name");

        if (!!cc.cloud_type && !!cc.cloud_versionstring &&
            "undefined" !== typeof cc.cloud_supported) {
            label_version.textContent = cc.cloud_versionstring;
            provider_name.textContent = cc.cloud_productname || '*cloud';
            logo.src = {
                "Nextcloud": "images/nextcloud-logo.svg",
                "ownCloud": "images/owncloud-logo.svg",
                "Unsupported": "../../icon48.png",
            }[cc.cloud_type];

            const obsolete_string = document.querySelector("#obsolete_string");
            obsolete_string.hidden = cc.cloud_supported;
        } else {
            provider_name.textContent = '*cloud';
            logo.src = "../../icon48.png";
            label_version.textContent = "";
        }
    }
}