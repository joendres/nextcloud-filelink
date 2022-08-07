import { readFileSync, writeFileSync, mkdirSync, copyFile, copyFileSync } from "fs";
import { dirname, normalize, basename } from "path";
import pkg from 'glob';
const { glob } = pkg;

const url = "https://gitlab.com/api/v4/markdown";
const out_dir = "./public/";

async function convert_file(filename) {
    let lang = dirname(normalize(filename));
    lang = lang.match(/^\w\w(_\w\w)?$/) ? lang : "en";
    const htmlhead = `<!DOCTYPE html><html lang="${lang}"><meta charset="UTF-8"><link rel="stylesheet" href="style.css">`;
    const lang_dir = out_dir + (lang === "en" ? "" : lang + "/");

    const text = readFileSync(filename, "utf-8");

    const data = {
        text,
        gfm: true,
        project: "joendres/filelink-nextcloud",
    };
    const title = text.match(/^#\s+(.+)/)[1];

    const fetchInit = {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", },
    };

    const response = await fetch(url, fetchInit);
    const json = await response.json();
    const html = json.html
        .replace(/user-content-/g, "")
        .replace(/\/joendres\/filelink-nextcloud\/-\/blob\/master\/(\w\w(_\w\w)?\/)README.\w\w(_\w\w)?.md/, "$1");

    try {
        mkdirSync(lang_dir);
    } catch (_) { /* ignore */ }
    ["logo.png", "style.css",].forEach(f => copyFile(out_dir + f, lang_dir + f, () => { }));

    writeFileSync(lang_dir + "/index.html",
        htmlhead + "<title>" + title + "</title>" + html);
}

try {
    mkdirSync(out_dir);
} catch (_) { /* ignore */ }
glob.sync("./build-tools/public-template/*").forEach(f => copyFileSync(f, out_dir + basename(f)));

convert_file("./README.md");
glob.sync("*/README*.md").forEach(convert_file);