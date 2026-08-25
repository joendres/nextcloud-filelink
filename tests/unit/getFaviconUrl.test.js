// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFaviconUrl } from "../../src/lib/getFaviconUrl.js";
import { convertToDataUrl } from "../../src/lib/imageconvert.js";
import { CLOUDTYPE } from "../../src/lib/cloudcapabilities.js";

vi.mock("../../src/lib/imageconvert.js", () => ({
    convertToDataUrl: vi.fn(),
}));

function fakeResponse({ ok = true, url = "https://cloud.example/", bodyText = "", blobType = "" } = {}) {
    return {
        ok,
        url,
        text: async () => bodyText,
        blob: async () => new Blob([bodyText], { type: blobType }),
    };
}

describe("getFaviconUrl", () => {
    let capabilities;

    beforeEach(() => {
        capabilities = { theme_icon_url: undefined, cloud_type: CLOUDTYPE.NEXTCLOUD };
        vi.stubGlobal("fetch", vi.fn());
        convertToDataUrl.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses theme_icon_url as cloud_logo_url and the converted result as service_icon", async () => {
        capabilities.theme_icon_url = "https://cloud.example/service_icon.svg";
        fetch.mockResolvedValueOnce(fakeResponse({ bodyText: "<svg></svg>" }));
        convertToDataUrl.mockResolvedValueOnce("data:image/png;base64,AAAA");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result).toEqual({
            cloud_logo_url: "https://cloud.example/service_icon.svg",
            service_icon: "data:image/png;base64,AAAA",
        });
    });

    it("falls back to page scan if theme_icon_url is undefined", async () => {
        fetch
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: '<html><head><link rel="icon" href="/static/icon.png"></head></html>',
            }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl.mockResolvedValueOnce("data:image/png;base64,BBBB");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("https://cloud.example/static/icon.png");
    });

    it("falls back to page scan if theme_icon_url download fails", async () => {
        capabilities.theme_icon_url = "https://cloud.example/service_icon.ico";
        fetch
            .mockResolvedValueOnce(fakeResponse({ ok: false }))
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: '<html><head><link rel="icon" href="/static/icon.png"></head></html>',
            }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl.mockResolvedValueOnce("data:image/png;base64,CCCC");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("https://cloud.example/static/icon.png");
    });

    it("falls back to page scan if the downloaded service_icon can't be converted", async () => {
        capabilities.theme_icon_url = "https://cloud.example/service_icon.svg";
        fetch
            .mockResolvedValueOnce(fakeResponse({ bodyText: "not actually an image" }))
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: '<html><head><link rel="icon" href="/static/icon.png"></head></html>',
            }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl
            .mockRejectedValueOnce(new Error("decode failed"))
            .mockResolvedValueOnce("data:image/png;base64,DDDD");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("https://cloud.example/static/icon.png");
    });

    it("prefers apple-touch-icon over a regular icon link when both are present", async () => {
        fetch
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: `<html><head>
                    <link rel="icon" href="/static/icon.png">
                    <link rel="apple-touch-icon" href="/static/apple-touch-icon.png">
                </head></html>`,
            }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl.mockResolvedValueOnce("data:image/png;base64,EEEE");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("https://cloud.example/static/apple-touch-icon.png");
    });

    it("falls back to a regular icon link if no apple-touch-icon is present", async () => {
        fetch
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: '<html><head><link rel="icon" href="/static/icon.png"></head></html>',
            }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl.mockResolvedValueOnce("data:image/png;base64,FFFF");

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("https://cloud.example/static/icon.png");
    });

    it("falls back to the default icon if the downloaded favicon can't be converted", async () => {
        fetch
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: '<html><head><link rel="icon" href="/static/icon.png"></head></html>',
            }))
            .mockResolvedValueOnce(fakeResponse({ bodyText: "not actually an image" }))
            .mockResolvedValueOnce(fakeResponse({}));
        convertToDataUrl
            .mockRejectedValueOnce(new Error("decode failed"));

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("/icons/nextcloud-logo.svg");
    });

    it('falls back to default icon if the html of the start page is invalid', async () => {
        fetch
            .mockResolvedValueOnce(fakeResponse({
                url: "https://cloud.example/login",
                bodyText: 'invalid garble, should make DOMParser throw',
            }));

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(result.cloud_logo_url).toBe("/icons/nextcloud-logo.svg");

    })
    it.for([
        [CLOUDTYPE.NEXTCLOUD, "/icons/nextcloud-logo.svg"],
        [CLOUDTYPE.OWNCLOUD, "/icons/owncloud-logo.svg"],
        [CLOUDTYPE.INFINITESCALE, "/icons/ocis-app-icon.png"],
        [CLOUDTYPE.OPENCLOUD, "/icons/opencloud-logo.svg"],
        [CLOUDTYPE.OTHER, "/icons/icon48.png"],
        ["invalid", "/icons/icon48.png"],
    ])("falls back to the correct local default icon per cloud_type", async ([type, file]) => {
        fetch.mockResolvedValueOnce(fakeResponse({ ok: false }));
        capabilities.cloud_type = type;

        const result = await getFaviconUrl(capabilities, "https://cloud.example/");

        expect(convertToDataUrl).not.toHaveBeenCalled();
        expect(result).toEqual({
            cloud_logo_url: file,
            service_icon: file,
        });
    });

});