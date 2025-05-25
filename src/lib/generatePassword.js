// Copyright (C) 2021-2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
* Generates a password
*
* On Nextcloud, most strict password policy require:
* - Enforce upper and lower case characters
* - Enforce numeric characters
* - Enforce special characters
* @param {number} length Length of password to generate
* @returns {string} Generated password
* @throws {Error} If length is negative
*/
function generatePassword(length) {
    if (length < 0) {
        throw new Error("Password length must be positive");
    }

    const pool = [
        "abcdefghijkmnopqrstuvwxyz",
        "ABCDEFGHJKLMNPQRSTUVWXYZ",
        "23456789",
        // Excludes characters that
        // - fail to output in HTML: <>
        // - are hard to distinguish and easily overlooked: O0lI1|'`
        // - might confuse users because they are quoted or not: "\
        '!#$%&()*+-./:;=?@[]^_{}~',
    ];

    let password = [];
    if (length >= 4) {
        // Make sure the "one of each" rule is met
        for (const kind of pool) {
            // Add one character of each kind to the password
            password.push(kind[Math.floor(Math.random() * kind.length)]);
        }
    }

    // Fill up to length with random characters
    const joint_pool = pool.join('');
    for (let index = password.length; index < length; index++) {
        password.push(joint_pool[Math.floor(Math.random() * joint_pool.length)]);
    }

    // Shuffle using the Fisher-Yates algorithm
    for (let i = password.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [password[i], password[j]] = [password[j], password[i]];
    }

    // Return the password array joint into a string
    return password.join('');
}

/* exported generatePassword */