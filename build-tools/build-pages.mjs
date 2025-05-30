// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT
//
// This script converts markdown files to HTML using the GitLab API

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, normalize } from "node:path";
import process from "node:process";

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
    const htmlhead = `<!DOCTYPE html><html lang="${lang}"><meta charset="UTF-8"><link rel="stylesheet" href="style.css">`;

    const text = readFileSync(in_file, "utf-8");

    const data = {
        text,
        gfm: true,
        project: "joendres/filelink-nextcloud",
    };

    // Take html title from first H1 of markdown
    const headings = text.match(/^#\s+(.+)/m);
    const title = (headings && headings[1]) ?
        // Remove emphasis
        headings[1].replaceAll("_", "")
        : "";

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
        const html = json.html
            .replace(/user-content-/g, "")
            .replace(/https:[-./\w]+?\/((\w\w\/)?[.\w]+.md)/g, (_, p1) => files[p1]);

        writeFileSync(out_dir + out_file,
            htmlhead + "<title>" + title + "</title>" + html);
    } else {
        console.error("No HTML in API response:", json.message);
        process.exit(1);
    }
}
