// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT
// AI support by Claude Sonnet 5

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FreeSpaceDisplay } from "../../src/management/freespacedisplay.js";
import { CLOUDTYPE } from "../../src/lib/cloudcapabilities.js";
import { CloudConnection } from "../../src/lib/cloudconnection.js";

vi.mock("../../src/lib/cloudconnection.js", () => ({
    CloudConnection: vi.fn(),
}));

function setDom() {
    document.body.innerHTML = `
        <div id="freespaceDisplay" style="visibility: hidden;">
            <span id="freespacelabel"></span>
        </div>
    `;
}

function makeAccount(usable = true) {
    return { usable: vi.fn().mockResolvedValue(usable) };
}

function makeCapabilities(cloud_type = CLOUDTYPE.NEXTCLOUD) {
    return { cloud_type };
}

describe("FreeSpaceDisplay", () => {
    beforeEach(() => {
        setDom();
        globalThis.browser = {
            i18n: {
                getMessage: vi.fn((key, [amount]) => `${key}:${amount}`),
            },
        };
        CloudConnection.mockReset();
    });

    afterEach(() => {
        delete globalThis.browser;
        vi.restoreAllMocks();
    });

    describe("hide / show", () => {
        it("hide() sets visibility hidden without touching label content or class", () => {
            const label = document.getElementById("freespacelabel");
            label.textContent = "freespace:42GB";
            label.classList.add("freespace_low");

            FreeSpaceDisplay.hide();

            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("hidden");
            expect(label.textContent).toBe("freespace:42GB");
            expect(label.classList.contains("freespace_low")).toBe(true);
        });

        it("show() sets visibility visible without touching label content or class", () => {
            const label = document.getElementById("freespacelabel");
            label.textContent = "freespace:42GB";
            label.classList.add("freespace_low");

            FreeSpaceDisplay.show();

            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("visible");
            expect(label.textContent).toBe("freespace:42GB");
            expect(label.classList.contains("freespace_low")).toBe(true);
        });
    });

    describe("showIfValid", () => {
        it("shows the display if the label contains a non-numeric (formatted) value", () => {
            document.getElementById("freespacelabel").textContent = "freespace:42GB";

            FreeSpaceDisplay.showIfValid();

            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("visible");
        });

        it("does not show the display if the label is empty", () => {
            document.getElementById("freespacelabel").textContent = "";

            FreeSpaceDisplay.showIfValid();

            expect(document.getElementById("freespaceDisplay").style.visibility).not.toBe("visible");
        });

        it("does not show the display if the label is still empty", () => {
            document.getElementById("freespacelabel").textContent = "";

            FreeSpaceDisplay.showIfValid();

            expect(document.getElementById("freespaceDisplay").style.visibility).not.toBe("visible");
        });
    });

    describe("updateFromCloud", () => {
        it("hides the display and empties the label if the account is not usable", async () => {
            const account = makeAccount(false);

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(CloudConnection).not.toHaveBeenCalled();
            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("hidden");
            expect(document.getElementById("freespacelabel").textContent).toBe("");
        });

        it("hides the display and empties the label for CLOUDTYPE.OTHER", async () => {
            const account = makeAccount(true);

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities(CLOUDTYPE.OTHER));

            expect(CloudConnection).not.toHaveBeenCalled();
            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("hidden");
            expect(document.getElementById("freespacelabel").textContent).toBe("");
        });

        it("queries free space and shows a formatted label when usable and recognized", async () => {
            const account = makeAccount(true);
            CloudConnection.mockImplementation(function () {
                return { getFreeSpaceInfo: vi.fn().mockResolvedValue(50_000_000) };
            });

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(document.getElementById("freespacelabel").textContent).toBe("freespace:50MB");
            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("visible");
        });

        it("adds freespace_low class when below the threshold", async () => {
            const account = makeAccount(true);
            CloudConnection.mockImplementation(function () {
                return {
                    getFreeSpaceInfo: vi.fn().mockResolvedValue(1024), // 1 KB, well below 5120 KB
                }
            });

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(document.getElementById("freespacelabel").classList.contains("freespace_low")).toBe(true);
        });

        it("does not add freespace_low class when at/above the threshold", async () => {
            const account = makeAccount(true);
            CloudConnection.mockImplementation(function () {
                return { getFreeSpaceInfo: vi.fn().mockResolvedValue(5120 * 1024 + 1), };
            });

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(document.getElementById("freespacelabel").classList.contains("freespace_low")).toBe(false);
        });

        it("hides the display and empties the label for a negative spaceRemaining", async () => {
            const account = makeAccount(true);
            CloudConnection.mockImplementation(function () {
                return { getFreeSpaceInfo: vi.fn().mockResolvedValue(-1), };
            });

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(document.getElementById("freespacelabel").textContent).toBe("");
            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("hidden");
        });

        it("removes freespace_low class when the new value is not low", async () => {
            document.getElementById("freespacelabel").classList.add("freespace_low");
            const account = makeAccount(true);
            CloudConnection.mockImplementation(function () {
                return { getFreeSpaceInfo: vi.fn().mockResolvedValue(50_000_000), };
            });

            await FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());

            expect(document.getElementById("freespacelabel").classList.contains("freespace_low")).toBe(false);
        });
    });

    describe("updateFromCloud — race protection", () => {
        it("a later call's result wins even if it resolves before an earlier call", async () => {
            const account = makeAccount(true);

            let resolveFirst;
            const firstDeferred = new Promise(r => { resolveFirst = r; });

            CloudConnection
                .mockImplementationOnce(function () {
                    return {
                        getFreeSpaceInfo: vi.fn(() => firstDeferred),
                    }
                })
                .mockImplementationOnce(function () {
                    return {
                        getFreeSpaceInfo: vi.fn().mockResolvedValue(999_000_000),
                    }
                });

            // Start call 1 (slow), don't await yet
            const call1 = FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());
            // Start call 2 (fast) before call 1 resolves
            const call2 = FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());
            await call2;

            expect(document.getElementById("freespacelabel").textContent).toBe("freespace:999MB");

            // Now let call 1 resolve — it must NOT overwrite call 2's result
            resolveFirst(1_000_000);
            await call1;

            expect(document.getElementById("freespacelabel").textContent).toBe("freespace:999MB");
        });

        it("a stale call does not hide a display already shown by a newer call", async () => {
            const account = makeAccount(true);
            let resolveFirst;
            const firstDeferred = new Promise(r => { resolveFirst = r; });

            CloudConnection
                .mockImplementationOnce(function () {
                    return {
                        getFreeSpaceInfo: vi.fn(() => firstDeferred),
                    }
                })
                .mockImplementationOnce(function () {
                    return {
                        getFreeSpaceInfo: vi.fn().mockResolvedValue(10_000_000),
                    }
                });

            const call1 = FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());
            const call2 = FreeSpaceDisplay.updateFromCloud(account, makeCapabilities());
            await call2;

            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("visible");

            resolveFirst(-1); // stale call would hide/reset if not guarded
            await call1;

            expect(document.getElementById("freespaceDisplay").style.visibility).toBe("visible");
            expect(document.getElementById("freespacelabel").textContent).toBe("freespace:10MB");
        });
    });
});