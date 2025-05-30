// Copyright (C) 2025 Johannes Endres
//
// SPDX-License-Identifier: MIT
//
// This script bumps a SemVer version number by one part, e.g. from 1.2.3 to 1.2.4

import path from 'node:path';
import process from "node:process";

const versionPartNames = {
    patch: 2,
    fix: 2,
    bug: 2,
    minor: 1,
    feat: 1,
    feature: 1,
    major: 0,
    breaking: 0,
    'fix!': 0,
    'feat!': 0,
};

if (process.argv.length < 4) {
    exitWithHelpMsg();
}

// translate the command line argument to the index of the version part
// to bump. The index is 0-based, so patch is 2, minor is 1 and major is 0.
const what_to_bump = versionPartNames[process.argv[2]];
if (!what_to_bump) {
    exitWithHelpMsg();
}

// parse semver from command line
const version = parseSemver(process.argv[3]);
if (!version) {
    exitWithHelpMsg();
}

// inc the relevant part
version[what_to_bump]++;
// zero all parts after that
for (let index = what_to_bump + 1; index < version.length; index++) {
    version[index] = 0;
}

process.stdout.write(version.join('.'));

/**
 * Parse a [SemVer](https://semver.org/) string into an array.
 * 
 * The properties major, minor and patch are in elements 0, 1 and 2
 * respectively. Returns null if the string is not a valid Semver.
 * @param {string} semver The SemVer string
*/
function parseSemver(semver) {
    // This regex is from https://semver.org/
    const regex = [
        '^(0|[1-9]\\d*)',   // major
        '\\.(0|[1-9]\\d*)', // minor
        '\\.(0|[1-9]\\d*)', // patch
        '(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?', // prerelease
        '(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?', // buildmeta
        '[\\n\\s]*$', // Ignore trailing whitespace and newline
    ].join('');
    const found = RegExp(regex).exec(semver);

    // found[0] is the whole match, the groups start at 1
    return !found ? null : [
        parseInt(found[1]),
        parseInt(found[2]),
        parseInt(found[3]),
        // Remove prerelease and buildmeta
    ];
}

function exitWithHelpMsg() {
    process.stderr.write(
        "node " +
        path.basename(process.argv[1]) +
        " <" +
        Object.keys(versionPartNames).sort().join('|') +
        "> <SemVer>\n");
    process.exit(7);

}