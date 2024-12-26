// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { readFileSync, writeFileSync } from "fs";
import { dirname, normalize } from "path";

const url = "https://gitlab.com/api/v4/markdown";
const out_dir = "./public/";

async function convert_file(filename) {
    let lang = dirname(normalize(filename));
    lang = lang.match(/\w{2,5}/) ? lang : "en";
    const htmlhead = `<!DOCTYPE html><html lang="${lang}"><meta charset="UTF-8"><link rel="stylesheet" href="style.css">`;

    const text = readFileSync(filename, "utf-8");

    const data = {
        text,
        gfm: true,
        project: "joendres/filelink-nextcloud",
    };
    const title = text.match(/^#\s+(.+)/m)[1];

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
    const html = json.html
        .replace(/user-content-/g, "")
        .replace(/\/joendres\/filelink-nextcloud\/-\/blob\/master\/de\/README.de.md/, "de/");

    writeFileSync(out_dir + dirname(normalize(filename)) + "/index.html",
        htmlhead + "<title>" + title + "</title>" + html);
}

["./README.md", "./de/README.de.md"].forEach(convert_file);