export class HeaderHandler {

    /**
     * Update the free space info
     * @param {CloudAccount} cc The CloudAccount object containing the free space info
     */
    static async updateFreespace(cc) {
        /** @type {HTMLDivElement} */
        const freespaceinfo = document.querySelector("#freespaceinfo");

        freespaceinfo.hidden = true;

        if (cc.free >= 0 && cc.total >= 0 &&
            cc.free <= Number.MAX_SAFE_INTEGER && cc.total <= Number.MAX_SAFE_INTEGER &&
            isFinite(cc.free) && isFinite(cc.total)) {

            /** @type {HTMLLabelElement} */
            const freespacelabel = document.querySelector("#freespacelabel");
            freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                HeaderHandler.humanReadable(cc.free),
                HeaderHandler.humanReadable(cc.total),]);

            /** @type {HTMLMeterElement} */
            const freespace = document.querySelector("#freespace");
            freespace.max = cc.total;
            freespace.value = cc.free;
            freespace.low = Math.floor(cc.total / 20);

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
        if (bytes < 0 || bytes > Number.MAX_SAFE_INTEGER) {
            throw new RangeError();
        }
        const units = ["EB", "PB", "TB", "GB", "MB", "KB", "B",];
        let unit = units.pop();
        while (bytes >= 1000) {
            bytes /= 1000;
            unit = units.pop();
        }
        return bytes.toLocaleString(undefined, { maximumSignificantDigits: 3, }) +  unit;
    }

    /**
     * Show the name, type and version of the cloud
     * @param {CloudAccount} cc The CloudAccount linked to the currently
     * open dialog
     */
    static updateCloudVersion(cc) {
        /** @type {HTMLImageElement} */
        const logo = document.querySelector("#logo");
        /** @type {HTMLLabelElement} */
        const label_version = document.querySelector("#label_version");
        /** @type {HTMLHeadingElement} */
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

            /** @type {HTMLDivElement} */
            const obsolete_string = document.querySelector("#obsolete_string");
            obsolete_string.hidden = cc.cloud_supported;
        } else {
            provider_name.textContent = '*cloud';
            logo.src = "../../icon48.png";
            label_version.textContent = "";
        }
    }
}