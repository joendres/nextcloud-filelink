// Copyright (C) 2024 Johannes Endres <je@johannes-endres.de>
//
// SPDX-License-Identifier: MIT

/**
 * Parse a [SemVer](https://semver.org/) string into an object.
 * 
 * The properties major, minor and patch will be NaN if the input string is not a valid semver
 * @param {string} semver The SemVer string
*/
function parseSemver(semver) {
    // This regex is from https://semver.org/
    const regex = [
        '^(0|[1-9]\\d*)',   // major
        '\\.(0|[1-9]\\d*)', // minor
        '\\.(0|[1-9]\\d*)', // patch
        '(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?', // prerelease
        '(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$', // buildmeta
    ].join('');
    const found = RegExp(regex).exec(semver) || [];

    // found[0] is the whole match, the groups start at 1
    return {
        major: parseInt(found[1]),
        minor: parseInt(found[2]),
        patch: parseInt(found[3]),
        prerelease: found[4],
        buildmetadata: found[5],
    };
}

/* exported parseSemver */
