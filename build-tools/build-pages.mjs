// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT
//
// This script converts markdown files to HTML using the GitLab API

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, normalize } from "node:path";
import process from "node:process";
import { JSDOM } from "jsdom";

// Take the GitLab API URL from the environment variable CI_API_V4_URL if available,
// otherwise use the default GitLab API URL.
const url = (process.env.CI_API_V4_URL || "https://gitlab.com/api/v4") + "/markdown";

// This is the default artifacts dir in GitLab CI/CD
// Change it to whatever pages.path is in your .gitlab-ci.yml
const out_dir = "./public/";

const files = {
    "README.md": "index.html",
    "de/README.de.md": "de/index.html",
    "CONTRIBUTING.md": "contributing.html"
};

for (const file in files) {
    convert_file(file, files[file]);
}

async function convert_file(in_file, out_file) {
    console.log("Converting", in_file);

    let lang = dirname(normalize(in_file));
    lang = lang.match(/\w{2,5}/) ? lang : "en";
    const htmlhead = `<!DOCTYPE html><html lang="${lang}"><meta charset="UTF-8"><link rel="stylesheet" href="style.css">\n`;

    const text = readFileSync(in_file, "utf-8");

    const data = {
        text,
        gfm: true,
        project: "joendres/filelink-nextcloud",
    };

    const fetchInit = {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "PRIVATE-TOKEN": process.env.GITLAB_PROJECT_TOKEN,
        }
    };

    const response = await fetch(url, fetchInit);
    if (!response.ok) {
        console.error("API call failed:", response.statusText);
        process.exit(1);
    }

    const json = await response.json();
    // No need for error handling as this will throw on errors and as a consequence abort the script

    if (json.html) {
        const dom = new JSDOM(htmlhead + json.html);

        // Take html title from first H1 of markdown
        const headings = text.match(/^#\s+(.+)/m);
        if (headings && headings[1]) {
            // Remove emphasis
            dom.window.document.title = headings[1].replaceAll("_", "");
        }

        // Remove "user-content-" from all IDs
        for (const el of dom.window.document.querySelectorAll("[id^='user-content-']")) {
            el.id = el.id.replace(/^user-content-/, "");
        }

        const masterUrl = process.env.CI_PROJECT_URL + '/-/blob/master/';
        // Fix links to markdown files that are converted to HTML in this script
        for (const el of dom.window.document.querySelectorAll('a[href^="' + masterUrl + '"]')) {
            el.href = el.href.replace(
                new RegExp(`^${masterUrl}(` + Object.keys(files).join('|') + ')'),
                (_, p1) => files[p1]);
        }

        const publicUrl = process.env.CI_PROJECT_URL + '/-/raw/master/public/';
        // Fix links to images in the public directory
        for (const el of dom.window.document.querySelectorAll('img[data-src^="' + publicUrl + '"]')) {
            el.dataset.src = el.dataset.src.slice(publicUrl.length);
        }

        // Simplify html by removing all data-sourcepos attributes
        for (const el of dom.window.document.querySelectorAll('[data-sourcepos]')) {
            el.removeAttribute('data-sourcepos');
        }

        writeFileSync(out_dir + out_file, dom.serialize());
    } else {
        console.error("No HTML in API response:", json.message);
        process.exit(1);
    }
}
