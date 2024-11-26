// SPDX-FileCopyrightText: 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

class utils {
    /**
     * Encode everything that might need encoding in pathnames, including those
     * chars encodeURIComponent leaves as is
     * @param {string} aStr 
     * @returns {string} Encoded path
     */
    static encodepath(aStr) {
        return aStr.
            split("/").
            map(c => encodeURIComponent(c).replace(/[~*']/g, m => "%" + m.charCodeAt(0).toString(16))).
            join("/");
    }

    /**
     * Create a Promise that resolves after a given timeout
     * @param {number} ms The timeout in milliseconds
     */
    static promisedTimeout(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    /**
     * Parse a SemVer string into an object.
     * 
     * The properties major, minor and patch will be NaN if the input string is not a valid semver
     * @param {string} semver The SemVer string
     * @returns {{ major: number, 
     *             minor: number,
     *             patch: number,
     *             prerelease: (string|undefined),
     *             buildmetadata: (string|undefined)
     * }} An object containing the parts of the string as defined by SemVer
     */
    static parseSemVer(semver) {
        // This regex is from https://semver.org/
        const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        const found = semver.match(regex) || [];

        return {
            // found[0] is the whole match, the groups start at 1
            major: parseInt(found[1]),
            minor: parseInt(found[2]),
            patch: parseInt(found[3]),
            prerelease: found[4],
            buildmetadata: found[5],
        };
    }
}

/* exported utils */