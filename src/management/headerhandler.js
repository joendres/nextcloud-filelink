// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

export class HeaderHandler {
    /**
     * Update the free space info
     * @param {CloudAccount} account The CloudAccount object containing the free space info
     */
    static updateFreespace(account) {
        /** @type {HTMLDivElement} */
        const freespaceinfo = document.querySelector("#freespaceinfo");

        freespaceinfo.hidden = true;

        if (account.free >= 0 && account.total >= 0) {

            /** @type {HTMLLabelElement} */
            const freespacelabel = document.querySelector("#freespacelabel");
            freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                HeaderHandler.humanReadable(account.free),
                HeaderHandler.humanReadable(account.total),]);

            /** @type {HTMLMeterElement} */
            const freespace = document.querySelector("#freespace");
            freespace.max = account.total;
            freespace.value = account.free;
            freespace.low = Math.floor(account.total / 20);

            freespaceinfo.hidden = false;
        }
    }

    /**
     * Turn a number of bytes into a human readable string like 1.5 MB
     * @param {number} bytes A positive safe number
     * @returns {string} A string with locale decimal separator and maximum 3 significant digits
     * @throws {RangeError} If the bytes is below 0 or too big to handle
     */
    static humanReadable(bytes) {
        if (!Number.isSafeInteger(bytes) || bytes < 0) {
            throw new RangeError();
        }
        const units = ["PB", "TB", "GB", "MB", "KB", "B",];
        let unit = units.pop();
        while (bytes >= 1000) {
            bytes /= 1000;
            unit = units.pop();
            if (undefined === unit) {
                throw new RangeError();
            }
        }
        return bytes.toLocaleString(undefined, { maximumSignificantDigits: 3, }) + unit;
    }

    /**
     * Show the name, type and version of the cloud
     * @param {CloudAccount} account The CloudAccount linked to the currently
     * open dialog
     */
    static updateCloudVersion(account) {
        /** @type {HTMLImageElement} */
        const logo = document.querySelector("#logo");
        /** @type {HTMLLabelElement} */
        const label_version = document.querySelector("#label_version");
        /** @type {HTMLHeadingElement} */
        const provider_name = document.querySelector("#provider_name");

        // Set the defaults
        provider_name.textContent = '*cloud';
        label_version.textContent = "";
        logo.classList.remove("nextcloud");
        logo.classList.remove("owncloud");

        if ("undefined" !== typeof account.cloud_supported) {
            if (account.cloud_type) {
                switch (account.cloud_type) {
                    case "Nextcloud":
                        logo.classList.add("nextcloud");
                        break;
                    case "ownCloud":
                        logo.classList.add("owncloud");
                        break;
                    default:
                        break;
                }
            }
            if (account.cloud_versionstring) {
                label_version.textContent = account.cloud_versionstring;
            }
            provider_name.textContent = account.cloud_productname || account.cloud_type || '*cloud';
        }
    }
}