// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CLOUDTYPE } from "../lib/cloudcapabilities.js";
import { CloudConnection } from "../lib/cloudconnection.js";

/**
 * Manages the free-space display.
 */
class FreeSpaceDisplay {
    /**
     * Call counter to resolve race conditions
     * @type {number}
     */
    static #callCount = 0;

    /**
     * Queries the cloud and puts the result (label text, `freespace_low`
     * class) into the DOM - the only method that does so.
     * @param {Account} account 
     * @param {CloudCapabilities} capabilities 
     */
    static async updateFromCloud(account, capabilities) {
        const callCount = ++FreeSpaceDisplay.#callCount;

        FreeSpaceDisplay.hide();
        const freespacelabel = document.getElementById("freespacelabel");
        // Use empty text as marker that no valid free space information is in
        // the label
        freespacelabel.textContent = "";

        if (await account.usable() && capabilities.cloud_type !== CLOUDTYPE.OTHER) {
            const cc = new CloudConnection(account);
            const spaceRemaining = await cc.getFreeSpaceInfo(capabilities);

            // If a later call of this method is running give it precedence
            if (callCount < FreeSpaceDisplay.#callCount) { return; }

            // Update the free space display
            freespacelabel.classList.remove('freespace_low');
            if (spaceRemaining >= 0 && spaceRemaining <= Number.MAX_SAFE_INTEGER) {
                freespacelabel.textContent = browser.i18n.getMessage("freespace", [
                    humanReadable(spaceRemaining),]);

                // the default mail.compose.big_attachments.threshold_kb
                if (spaceRemaining < 5120 * 1024) {
                    freespacelabel.classList.add('freespace_low');
                }
                FreeSpaceDisplay.show();
            }
        }
    }

    /**
     * Hide the free space element from the header
     */
    static hide() {
        const freespaceDisplay = document.getElementById("freespaceDisplay");
        freespaceDisplay.style.visibility = "hidden";
    }

    /**
     * Show the free space element
     */
    static show() {
        const freespaceDisplay = document.getElementById("freespaceDisplay");
        freespaceDisplay.style.visibility = "visible";
    }

    /**
     * Show the free space element only if it contains valid information.
     */
    static showIfValid() {
        const freespacelabel = document.getElementById("freespacelabel");

        if (freespacelabel.textContent !== "") {
            FreeSpaceDisplay.show();
        }
    }
}

/**
 * Format a positiv size in bytes with decimal based units like GB or TB. The
 * number is truncated at the decimal point.
 * @param {number} bytes 
 * @returns A number followed by the unit. "0B" for negative input.
 */
function humanReadable(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    if (bytes <= 0) { return '0\u2009B' };

    let value = Math.round(bytes);
    let unit = units.shift();
    while (value >= 1000 && units.length > 0) {
        value = Math.round(value / 1000);
        unit = units.shift();
    }
    return value + '\u2009' + unit;
}

export { FreeSpaceDisplay };
