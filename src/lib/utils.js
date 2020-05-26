/* MIT License

Copyright (c) 2020 Johannes Endres

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

/* exported encodepath */
/* exported daysFromTodayIso */
/* exported promisedTimeout*/
/* exported generatePassword */

/**
 * Encode everything that might need encoding in pathnames, including those
 * chars encodeURI leaves as is
 * @param {string} aStr 
 * @returns {string}
 */
function encodepath(aStr) {
    return encodeURI(aStr)
        .replace(/[,?:@&=+$#!'()*]/g,
            match => ('%' + match.charCodeAt(0).toString(16).toUpperCase()));
}

/**
 * Adds the given number of days to the current date and returns an ISO sting of
 * that date
 * @param {number} days Number of days to add
 */
function daysFromTodayIso(days) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days));
    return d.toISOString().slice(0, 10);
}

/**
 * Create a Promise that resolves after a given timeout
 * @param {number} ms The timeout in milliseconds
 */
function promisedTimeout(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**   
* Generates a password
*
* On Nextcloud, most strict password policy require:
* - Enforce upper and lower case characters
* - Enforce numeric characters
* - Enforce special characters
* @param {param} int length Length of password to generate
*/
function generatePassword(length) {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numeric = "0123456789";
    // Excludes characters that fail to output if continuous: <>
    // Excludes characters that are hard to distinguish and easily overlooked: ,'`
    const special = '!"#$%&()*+-./:;=?@[\\]^_{|}~';
    const seed = lower + upper + numeric + special;

    const lowerRegex = new RegExp("[" + lower + "]");
    const upperRegex = new RegExp("[" + upper + "]");
    const numericRegex = new RegExp("[" + numeric + "]");
    const specialRegex = new RegExp("[" + special + "]");

    let limit = 100000;
    let i = 0;
    let password = "";
    while (i < limit) {
        i++;
        password = Array.from(Array(length)).map(() => seed[Math.floor(Math.random() * seed.length)]).join("");

        if (!lowerRegex.test(password)) { continue; }
        if (!upperRegex.test(password)) { continue; }
        if (!numericRegex.test(password)) { continue; }
        if (!specialRegex.test(password)) { continue; }

        break;
    }
    return password;
}
