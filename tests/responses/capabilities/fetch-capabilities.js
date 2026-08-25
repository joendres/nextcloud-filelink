// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fetch, Agent } from "undici";

const BASE_URLS = {
    nextcloud: "http://localhost:8080/",
    owncloud: "http://localhost:8081/",
    ocis: "https://localhost:9201/",
    opencloud: "https://localhost:9200/",
    other: "https://amsterdam.demo.filerun.com/"
};

// Test-only credentials for disposable Docker instances. Never use for
// anything but throwaway containers destroyed after fixture collection.
const CREDENTIALS = {
    nextcloud: { username: "admin", password: "Password+123" },
    owncloud: { username: "admin", password: "Password+123" },
    ocis: { username: "admin", password: "Password+123" },
    opencloud: { username: "admin", password: "Password+123" },
    other: { username: "admin", password: "admin" },
};

const insecureAgent = new Agent({
    connect: { rejectUnauthorized: false },
});

async function fetchCapabilities(baseUrl, username, password) {
    const url = new URL("ocs/v1.php/cloud/capabilities?format=json", baseUrl);
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(url, {
        headers: {
            "OCS-APIRequest": "true",
            "Authorization": `Basic ${auth}`,
        },
        dispatcher: insecureAgent,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function main() {
    const [, , cloudType, option] = process.argv;

    if (!cloudType || !option) {
        console.error("Usage: node fetch-capabilities.js <cloudtype> <option>");
        console.error(`  <cloudtype>: one of ${Object.keys(BASE_URLS).join(", ")}`);
        process.exit(1);
    }

    const baseUrl = BASE_URLS[cloudType];
    const credentials = CREDENTIALS[cloudType];
    if (!baseUrl || !credentials) {
        console.error(`Unknown cloudtype "${cloudType}". Known: ${Object.keys(BASE_URLS).join(", ")}`);
        process.exit(1);
    }

    const json = await fetchCapabilities(baseUrl, credentials.username, credentials.password);

    const version = json?.ocs?.data?.version?.productversion ?? json?.ocs?.data?.version?.string;
    if (!version) {
        console.error("Could not find ocs.data.version.string in the response. Full response:");
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    const filename = `${cloudType}_${version}_${option}.json`;

    await writeFile(filename, JSON.stringify(json, null, 2) + "\n");
    console.log(`Written: ${filename}`);
}

main().catch(err => {
    console.error(err.message);
    process.exit(1);
});
