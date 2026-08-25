// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { describe, it, expect } from "vitest";
import { convertToDataUrl } from "../../src/lib/imageconvert.js";

describe("convertToDataUrl", () => {
    // 1x1 transparent PNG, real, valid image bytes
    const ONE_PIXEL_PNG_BASE64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    function base64ToBlob(base64, type) {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return new Blob([bytes], { type });
    }
    
    async function dataUrlToImageSize(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        return { width: img.naturalWidth, height: img.naturalHeight };
    }

    it("returns a valid PNG data URL for a valid image input", async () => {
        const blob = base64ToBlob(ONE_PIXEL_PNG_BASE64, "image/png");

        const result = await convertToDataUrl(blob);

        expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it("resizes the output to 32x32 by default", async () => {
        const blob = base64ToBlob(ONE_PIXEL_PNG_BASE64, "image/png");

        const result = await convertToDataUrl(blob);
        const size = await dataUrlToImageSize(result);

        expect(size).toEqual({ width: 32, height: 32 });
    });

    it("resizes the output to a custom target size", async () => {
        const blob = base64ToBlob(ONE_PIXEL_PNG_BASE64, "image/png");

        const result = await convertToDataUrl(blob, undefined, 64);
        const size = await dataUrlToImageSize(result);

        expect(size).toEqual({ width: 64, height: 64 });
    });

    it("rejects for input that isn't a decodable image", async () => {
        const blob = new Blob([new TextEncoder().encode("not an image")], { type: "text/plain" });

        await expect(convertToDataUrl(blob)).rejects.toThrow();
    });
});

describe("convertToDataUrl with SVG input", () => {
    function svgBlob(svgMarkup) {
        return new Blob([svgMarkup], { type: "image/svg+xml" });
    }

    const SIMPLE_SVG_WITH_DIMENSIONS = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>';
    const SIMPLE_SVG_WITHOUT_DIMENSIONS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>';

    it("converts a simple SVG blob (with explicit width/height) into a PNG data URL", async () => {
        const blob = svgBlob(SIMPLE_SVG_WITH_DIMENSIONS);

        const result = await convertToDataUrl(blob, undefined, 32);

        expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it("converts a simple SVG blob without intrinsic width/height, relying on resizeWidth/resizeHeight", async () => {
        const blob = svgBlob(SIMPLE_SVG_WITHOUT_DIMENSIONS);

        const result = await convertToDataUrl(blob, undefined, 32);

        expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it("produces an image of the requested target size", async () => {
        const blob = svgBlob(SIMPLE_SVG_WITH_DIMENSIONS);

        const result = await convertToDataUrl(blob, undefined, 64);

        const img = new Image();
        img.src = result;
        await img.decode();
        expect(img.naturalWidth).toBe(64);
        expect(img.naturalHeight).toBe(64);
    });
});

describe("convertToDataUrl with themeBackgroundColor", () => {
    async function dataUrlToPixel(dataUrl, x = 0, y = 0) {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();

        const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(x, y, 1, 1);
        return { r: data[0], g: data[1], b: data[2], a: data[3] };
    }

    async function makeTestPng({ size = 1, color = null } = {}) {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d");
        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, size, size);
        }
        // else: stays transparent (OffscreenCanvas default)
        return canvas.convertToBlob({ type: "image/png" });
    }

    it("leaves transparent areas transparent when themeBackgroundColor is not set", async () => {
        const blob = await makeTestPng(); // transparent

        const result = await convertToDataUrl(blob);
        const pixel = await dataUrlToPixel(result);

        expect(pixel.a).toBe(0);
    });

    it("fills transparent areas with themeBackgroundColor when set", async () => {
        const blob = await makeTestPng(); // transparent

        const result = await convertToDataUrl(blob, "#0082c9");
        const pixel = await dataUrlToPixel(result);

        expect(pixel).toEqual({ r: 0x00, g: 0x82, b: 0xc9, a: 255 });
    });

    it("does not alter opaque pixels when themeBackgroundColor is set", async () => {
        const blob = await makeTestPng({ color: "red" });

        const result = await convertToDataUrl(blob, "#0082c9");
        const pixel = await dataUrlToPixel(result);

        expect(pixel).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    });

    it("accepts named CSS colors, not just hex", async () => {
        const blob = await makeTestPng(); // transparent

        const result = await convertToDataUrl(blob, "white");
        const pixel = await dataUrlToPixel(result);

        expect(pixel).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });
});