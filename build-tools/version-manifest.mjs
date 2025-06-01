// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT
//
// This script updates the version in the manifest.json file.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from "node:process";

if (process.argv.length < 3) {
    exitWithHelpMsg();
}

// Read file src/manifest.json
const manifestFile = path.join(import.meta.dirname, '../src/manifest.json');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));

// Get the version from the command line argument
// The version is the first argument after the script name
// For this to work, the script must be called with node
const version = process.argv[2];

// Set the version in the manifest
manifest.version = version;

// Write the manifest back to the file
writeFileSync(manifestFile, JSON.stringify(manifest, null, 4));

function exitWithHelpMsg() {
    process.stderr.write(
        "node " + path.basename(process.argv[1]) + " <SemVer>\n");
    process.exit(17);
}