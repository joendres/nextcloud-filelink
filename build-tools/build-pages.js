/* Translates README.md into an html page using gitlab's API */

const fetch = require("node-fetch");
const fs = require('fs');

const url = "https://gitlab.com/api/v4/markdown";

const htmlhead = `<!DOCTYPE html>
    <html lang="en">
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="favicon.png" />
    <link rel="stylesheet" href="style.css">
    <title>*cloud - Filelink for Nextcloud and ownCloud</title>`;

const data = {
    text: fs.readFileSync("README.md", "utf-8"),
    gfm: true,
    project: "joendres/filelink-nextcloud",
};

const fetchInit = {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json", },
};

fetch(url, fetchInit)
    .then(response => response.json())
    .then(json => fs.writeFileSync("public/index.html", htmlhead + json.html));
