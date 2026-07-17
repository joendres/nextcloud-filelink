// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Encode everything that might need encoding in pathnames, including those
 * chars encodeURIComponent leaves as is
 * @param {string} aStr 
 * @returns {string} Encoded path
 */
function encodepath(aStr) {
    return aStr.
        split("/").
        map(c => encodeURIComponent(c).replace(/[~*']/g, m => "%" + m.charCodeAt(0).toString(16))).
        join("/");
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

export { encodepath, promisedTimeout };