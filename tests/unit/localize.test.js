// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("localize.js", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-message="greeting"></div>
            <span data-message="farewell"></span>
            <p>Untouched, no data-message attribute</p>
        `;

        globalThis.browser = {
            i18n: {
                getMessage: vi.fn(key => `translated:${key}`),
            },
        };

        vi.resetModules();
    });

    afterEach(() => {
        delete globalThis.browser;
    });

    it("sets textContent for every element with data-message via browser.i18n.getMessage", async () => {
        await import("../../src/lib/localize.js");

        expect(document.querySelector('[data-message="greeting"]').textContent)
            .toBe("translated:greeting");
        expect(document.querySelector('[data-message="farewell"]').textContent)
            .toBe("translated:farewell");
    });

    it("calls getMessage once per element with the message key as argument", async () => {
        await import("../../src/lib/localize.js");

        expect(globalThis.browser.i18n.getMessage).toHaveBeenCalledTimes(2);
        expect(globalThis.browser.i18n.getMessage).toHaveBeenCalledWith("greeting");
        expect(globalThis.browser.i18n.getMessage).toHaveBeenCalledWith("farewell");
    });

    it("leaves elements without data-message untouched", async () => {
        await import("../../src/lib/localize.js");

        expect(document.querySelector("p").textContent)
            .toBe("Untouched, no data-message attribute");
    });

    it("does nothing if no element has data-message", async () => {
        document.body.innerHTML = "<p>Nothing to localize</p>";

        await import("../../src/lib/localize.js");

        expect(globalThis.browser.i18n.getMessage).not.toHaveBeenCalled();
    });
});