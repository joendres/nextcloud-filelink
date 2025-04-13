// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { readFileSync, writeFileSync } from "fs";
import { dirname, normalize } from "path";

const url = "https://gitlab.com/api/v4/markdown";
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
    let lang = dirname(normalize(in_file));
    lang = lang.match(/\w{2,5}/) ? lang : "en";
    const htmlhead = `<!DOCTYPE html><html lang="${lang}"><meta charset="UTF-8"><link rel="stylesheet" href="style.css">`;

    const text = readFileSync(in_file, "utf-8");

    const data = {
        text,
        gfm: true,
        project: "joendres/filelink-nextcloud",
    };
    const title = text.match(/^#\s+(.+)/m)[1].replaceAll("_", "");

    const fetchInit = {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
            "PRIVATE-TOKEN": process.env.GITLAB_PROJECT_TOKEN,
        }
    };

    const response = await fetch(url, fetchInit);
    const json = await response.json();

    if (json.html) {
        const html = json.html
            .replace(/user-content-/g, "")
            .replace(/https:[-.\/\w]+?\/((\w\w\/)?[.\w]+.md)/g, (_, p1) => files[p1]);

        writeFileSync(out_dir + out_file,
            htmlhead + "<title>" + title + "</title>" + html);
    }
}
