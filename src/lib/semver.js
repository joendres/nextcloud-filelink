// Copyright (C) 2024 Johannes Endres <je@johannes-endres.de>
//
// SPDX-License-Identifier: MIT

class SemVer {
    /**
     * Parse a [SemVer](https://semver.org/) string into a new object.
     * 
     * The properties major, minor and patch will be NaN if the input string is not a valid semver
     * @param {string} semver The SemVer string
    */
    constructor(semver) {
        // This regex is from https://semver.org/
        const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        const found = semver.match(regex) || [];

        // found[0] is the whole match, the groups start at 1
        this.major = parseInt(found[1]);
        this.minor = parseInt(found[2]);
        this.patch = parseInt(found[3]);
        this.prerelease = found[4];
        this.buildmetadata = found[5];
    }
}

/* exported SemVer */