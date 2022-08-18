export class Utils {
    /**
     * Encode everything that might need encoding in pathnames, including those
     * chars encodeURIComponent leaves as is
     * @param {string} path The path string that might need encoding
     * @returns {string} Encoded path
     */
    static encodepath(path) {
        return path.
            split("/").
            map(c => Utils.encodeRFC3986(c)).
            join("/");
    }

    /**
     * URLEncode a string according to RFC 3986 (some more characters encoded
     * than with encodeURIComponent)
     * @param {string} str The string to encode
     */
    static encodeRFC3986(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, m => "%" + m.charCodeAt(0).toString(16));
    }
}
