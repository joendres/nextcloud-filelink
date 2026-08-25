// Copyright (C) 2021-2025 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
* Generates a random password
*
* On Nextcloud, the strictest password policy requires at least one upper and
* lower case character, numeric character and special character.
*
* Some characters that tend to cause problems will not appear in the password,
* for example 1, I, l and |.
* @param {number} length Length of password, integer between 0 and 255
* @returns {string} Generated password
* @throws {TypeError} If length is negative or too high
*/
function generatePassword(length) {
    if (length < 0 || length > 255) {
        throw new TypeError("Password length must be between 0 and 255");
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

    const password = [];
    if (length >= pool.length) {
        // Make sure the "one of each" rule is met
        for (const kind of pool) {
            // Add one character of each kind to the password
            password.push(kind[randomUIntBelow(kind.length)]);
        }
    }

    // Fill up to length with random characters
    const joint_pool = pool.join('');
    while (password.length < length) {
        password.push(joint_pool[randomUIntBelow(joint_pool.length)]);
    }

    // Shuffle using the Fisher-Yates algorithm
    for (let i = password.length - 1; i > 0; i--) {
        const j = randomUIntBelow(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    // Return the password array joint into a string
    return password.join('');
}

/**
 * Create a random 8-bit unsigned integer
 * @param {number} max The upper limit of the range of random numbers, has to be integer
 * @returns {number} An integer between 0 (including) and max (excluding)
 */
function randomUIntBelow(max) {
    // No need for UInt8 range check of max because this is only used after
    // password length check

    // Make sure, every possible modulus has equal probability 
    // AI Claude Sonnet 5, edited
    const range = 256 - (256 % max);
    let value;
    do {
        value = crypto.getRandomValues(new Uint8Array(1))[0];
    } while (value >= range);

    return value % max;
    // AI end
}

export { generatePassword };