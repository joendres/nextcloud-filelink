export class PasswordGenerator {
    /**
     * Generates a password
     *
     * On Nextcloud, most strict password policy require:
     * - Enforce upper case characters
     * - Enforce lower case characters
     * - Enforce numeric characters
     * - Enforce special characters
     * @param {number} length Length of password to generate
     * @returns {string} A string of random characters meeting these
     * constraints. The string is as long as the number of constraints (to meet
     * them all) or has the requested length, whatever is longer
     */
    static generate(length) {
        const char_classes = [
            "abcdefghijklmnopqrstuvwxyz",
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "0123456789",
            // Basic list from NC server sources, interface ISecureRandom
            // Exclude characters that fail to output: <>
            // Exclude characters that are hard to distinguish and easily overlooked: .'`
            '!"#$%&\\()*+,-/:;=?@[]^_{|}~',
        ];

        // Make sure all character classes are in the password
        const password = char_classes.map(randomlyChooseCharFromString);

        // Fill up with random characters
        const all_chars = char_classes.join('');
        while (password.length < length) {
            password.push(randomlyChooseCharFromString(all_chars));
        }

        // Shuffle and make it a string
        return password.sort(() => 0.5 - Math.random()).join('');

        /**
         * @param {string} str The string to choose from
         * @returns {string} One random character from that string
         */
        function randomlyChooseCharFromString(str) {
            // Because 1.0 is not a return value of Math.random, Math.floor would never give the last element, so it's not "str.length-1"
            let index = Math.floor(Math.random() * str.length);
            return str.charAt(index);
        }
    }
}
