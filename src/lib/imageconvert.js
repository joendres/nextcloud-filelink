// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
* Convert an image blob (any format Gecko can decode) into a resized PNG
* data URL.
*
* @param {Blob} blob The source image data
* @param {number} [size=32] Target width and height in pixels
* @param {string} [themeBackgroundColor] If set, transparent areas of the source image are filled with this CSS color before drawing (e.g. for logos designed for a colored background, like Nextcloud's).
* @returns {Promise<string|undefined>} A `data:image/png;base64,...` URL
*/
async function convertToDataUrl(blob, themeBackgroundColor, size = 32) {
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.src = url;
        await img.decode();

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");

        // Draw a background to make sure icons with transparency don't end up
        // white on white. This is roughly how Nextcloud displays its icon in
        // the navigation bar.
        if (undefined !== themeBackgroundColor) {
            context.fillStyle = themeBackgroundColor;
            context.fillRect(0, 0, size, size);
        }

        context.drawImage(img, 0, 0, size, size);

        return canvas.toDataURL("image/png");
    } finally {
        URL.revokeObjectURL(url);
    }
}

export { convertToDataUrl }