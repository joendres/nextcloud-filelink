// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { describe, it, vi, beforeEach, expect, afterEach } from "vitest";
import { CloudCapabilities, CLOUDTYPE } from "../../src/lib/cloudcapabilities.js";
import { readFileSync, readdirSync } from "node:fs";

const FIXTURE_DIR = "tests/responses/capabilities/";

function matchingFixtures(pattern) {
    return readdirSync(FIXTURE_DIR).filter(name => name.match(`^${pattern}\.json$`));
}

function readFixture(filename) {
    const contents = readFileSync(FIXTURE_DIR + filename);
    const parsed = JSON.parse(contents);
    return parsed.ocs.data;
}

describe('CloudCapabilities', () => {

    beforeEach(() => {
        globalThis.browser = {
            storage: {
                session: {
                    get: vi.fn().mockResolvedValue({}),
                    set: vi.fn().mockResolvedValue(undefined),
                    remove: vi.fn().mockResolvedValue(undefined),
                },
            },
        };
    });

    afterEach(() => {
        delete globalThis.browser;
    });

    describe('theme_color', () => {
        it('returns undefined if there is no color in the theming capabilities', async () => {
            const data = {};
            const cc = await CloudCapabilities.get("test-account");
            await cc.updateAndStore(data);

            expect(cc.theme_color).toBe(undefined);
        })

        it.for([
            'definitely not a valid CSS color, is it?',
            true,
            42,
        ])('returns undefined if the value for color in the theming capabilities is not a valid CSS color', async (input) => {
            const data = { capabilities: { theming: { color: input } } };
            const cc = await CloudCapabilities.get("test-account");
            await cc.updateAndStore(data);

            expect(cc.theme_color).toBe(undefined);
        })

        it.for([
            ["#010203", "rgb(1, 2, 3)"],
            ["white", "white"],
            ["blue", "blue"],
            ["rgb(4 5 6)", "rgb(4, 5, 6)"]
        ])('returns the CSS color if it is set in the theming capabilities', async ([input, expected]) => {
            const data = { capabilities: { theming: { color: input } } };
            const cc = await CloudCapabilities.get("test-account");
            await cc.updateAndStore(data);

            expect(cc.theme_color).toEqual(expected);
        })
    });

    describe('theme_icon_url', () => {
        it('returns the favicon url if it is present', () => {
            const url = "https://www.example.com/icon.png";
            const data = { capabilities: { theming: { favicon: url } } };
            const cc = new CloudCapabilities("test");
            cc.updateAndStore(data);

            const result = cc.theme_icon_url;
            expect(result).toEqual(url);
        });

        it('removes search parameters, login and hash', () => {
            const url = "https://user:pass@www.example.com:666/icon.png?x=y#hase";
            const data = { capabilities: { theming: { favicon: url } } };
            const cc = new CloudCapabilities("test");
            cc.updateAndStore(data);

            const result = cc.theme_icon_url;
            expect(result).toEqual("https://www.example.com:666/icon.png");
        });

        it('falls back to the log url if there is no favicon url', () => {
            const url = "https://www.example.com/icon.png";
            const data = { capabilities: { theming: { logo: url } } };
            const cc = new CloudCapabilities("test");
            cc.updateAndStore(data);

            const result = cc.theme_icon_url;
            expect(result).toEqual(url);
        });

        it('returns undefined if both icon urls are missing', () => {
            const data = {};
            const cc = new CloudCapabilities("test");
            cc.updateAndStore(data);

            const result = cc.theme_icon_url;
            expect(result).toBeUndefined();
        });

        it('returns undefined if the logo url is in the wrong place', () => {
            const url = "https://www.example.com/icon.png";
            const data = { capabilities: { theme: { logo: url } } };
            const cc = new CloudCapabilities("test");
            cc.updateAndStore(data);

            const result = cc.theme_icon_url;
            expect(result).toBeUndefined();
        })
    })

    describe('cloud_type', () => {
        it.for(matchingFixtures("nextcloud.*"))("Identifies Nextcloud from %s", async (filename) => {
            const cc = new CloudCapabilities("test");
            await cc.updateAndStore(readFixture(filename));

            expect(cc.cloud_type).toEqual(CLOUDTYPE.NEXTCLOUD);
        })

        it.for(matchingFixtures("owncloud.*"))("Identifies ownCloud Classic from %s", async (filename) => {
            const cc = new CloudCapabilities("test");
            await cc.updateAndStore(readFixture(filename));

            expect(cc.cloud_type).toEqual(CLOUDTYPE.OWNCLOUD);
        })

        it.for(matchingFixtures("opencloud.*"))("Identifies OpenCloud from %s", async (filename) => {
            const cc = new CloudCapabilities("test");
            await cc.updateAndStore(readFixture(filename));

            expect(cc.cloud_type).toEqual(CLOUDTYPE.OPENCLOUD);
        })

        it.for(matchingFixtures("ocis.*"))("Identifies oCIS from %s", async (filename) => {
            const cc = new CloudCapabilities("test");
            await cc.updateAndStore(readFixture(filename));

            expect(cc.cloud_type).toEqual(CLOUDTYPE.INFINITESCALE);
        })

        it.for(matchingFixtures("other.*"))("Identifies not a supported cloud from %s", async (filename) => {
            const cc = new CloudCapabilities("test");
            await cc.updateAndStore(readFixture(filename));

            expect(cc.cloud_type).toEqual(CLOUDTYPE.OTHER);
        })
    })

    describe('cloud_logo_url', () => {
        it('returns the standard icon if no other is set', () => {
            const cc = new CloudCapabilities("test");
            expect(cc.service_icon).toEqual("../icons/icon48.png");
        })

        it('returns a url that has been set before', () => {
            const url = "https://www.example.com/icon.png";
            const cc = new CloudCapabilities("test");
            cc.updateAndStore({ service_icon: url });

            expect(cc.service_icon).toEqual(url);
        })
    })

    describe('service_icon', () => {
        it('returns the standard icon if no other is set', () => {
            const cc = new CloudCapabilities("test");
            expect(cc.service_icon).toEqual("../icons/icon48.png");
        })

        it('returns a url that has been set before', () => {
            const url = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            const cc = new CloudCapabilities("test");
            cc.updateAndStore({ service_icon: url });

            expect(cc.service_icon).toEqual(url);
        })
    })

    describe('cloud_versionstring', () => {
        it('returns version.productversion if that is present', () => {
            const cc = new CloudCapabilities("arguments");
            cc.updateAndStore({ version: { productversion: "8.2.0" } });
            expect(cc.cloud_versionstring).toEqual("8.2.0");
        })
        it('falls back to version.string', () => {
            const cc = new CloudCapabilities("arguments");
            cc.updateAndStore({ version: { string: "32.0.7" } });
            expect(cc.cloud_versionstring).toEqual("32.0.7");
        })
        it('returns an empty string if neither is defined', () => {
            const cc = new CloudCapabilities("arguments");
            cc.updateAndStore({ version: {} });
            expect(cc.cloud_versionstring).toEqual("");
        })
        it('returns an empty string if version is not set yet', () => {
            const cc = new CloudCapabilities("arguments");
            expect(cc.cloud_versionstring).toEqual("");
        })

    })

    describe('supported_version', () => {
        function mockedCloudCapabilities(versionstring, cloud_type) {
            const cc = new CloudCapabilities("prototype");
            vi.spyOn(cc, "cloud_versionstring", "get").mockReturnValue(versionstring);
            vi.spyOn(cc, "cloud_type", "get").mockReturnValue(cloud_type);
            return cc;
        }
        /*
        [CLOUDTYPE.INFINITESCALE]: "5",
        [CLOUDTYPE.OPENCLOUD]: "4",
     */

        it.for([
            // exactly the smallest supported version
            [true, "32.0.0", CLOUDTYPE.NEXTCLOUD],
            [true, "10.0.10", CLOUDTYPE.OWNCLOUD],
            [true, "5.0.0", CLOUDTYPE.INFINITESCALE],
            [true, "4.0.0", CLOUDTYPE.OPENCLOUD],
            // The current versions as of 2026-08-21
            [true, "34.0.3", CLOUDTYPE.NEXTCLOUD],
            [true, "10.16.4", CLOUDTYPE.OWNCLOUD],
            [true, "11.0.0", CLOUDTYPE.OWNCLOUD],
            [true, "8.2.0", CLOUDTYPE.INFINITESCALE],
            [true, "7.3.2", CLOUDTYPE.INFINITESCALE],
            [true, "7.4.0", CLOUDTYPE.OPENCLOUD],
            [true, "7.2.3", CLOUDTYPE.OPENCLOUD],
            [true, "4.0.9", CLOUDTYPE.OPENCLOUD],
            // The latest not supported
            [false, "31.0.14", CLOUDTYPE.NEXTCLOUD],
            [false, "10.0.9", CLOUDTYPE.OWNCLOUD],
            [false, "9.1.8", CLOUDTYPE.OWNCLOUD],
            [false, "4.0.7", CLOUDTYPE.INFINITESCALE],
            [false, "3.7.0", CLOUDTYPE.OPENCLOUD],
            // Empty or missing version strings
            [true, "", CLOUDTYPE.NEXTCLOUD],
            [true, "", CLOUDTYPE.OWNCLOUD],
            [true, "", CLOUDTYPE.INFINITESCALE],
            [true, "", CLOUDTYPE.OPENCLOUD],
            [true, undefined, CLOUDTYPE.NEXTCLOUD],
            [true, undefined, CLOUDTYPE.OWNCLOUD],
            [true, undefined, CLOUDTYPE.INFINITESCALE],
            [true, undefined, CLOUDTYPE.OPENCLOUD],
            // Invalid version strings
            [false, "1..2", CLOUDTYPE.NEXTCLOUD],
            [false, "1..2", CLOUDTYPE.OWNCLOUD],
            [false, "1..2", CLOUDTYPE.INFINITESCALE],
            [false, "1..2", CLOUDTYPE.OPENCLOUD],
            [false, "invalid", CLOUDTYPE.NEXTCLOUD],
            [false, "invalid", CLOUDTYPE.OWNCLOUD],
            [false, "invalid", CLOUDTYPE.INFINITESCALE],
            [false, "invalid", CLOUDTYPE.OPENCLOUD],
            [false, 42, CLOUDTYPE.NEXTCLOUD],
            [false, 42, CLOUDTYPE.OWNCLOUD],
            [false, 42, CLOUDTYPE.INFINITESCALE],
            [false, 42, CLOUDTYPE.OPENCLOUD],
            [false, [99, 0, 1], CLOUDTYPE.NEXTCLOUD],
            [false, [99, 0, 1], CLOUDTYPE.OWNCLOUD],
            [false, [99, 0, 1], CLOUDTYPE.INFINITESCALE],
            [false, [99, 0, 1], CLOUDTYPE.OPENCLOUD],
            [false, { major: 99, minor: 0, patch: 1 }, CLOUDTYPE.NEXTCLOUD],
            [false, { major: 99, minor: 0, patch: 1 }, CLOUDTYPE.OWNCLOUD],
            [false, { major: 99, minor: 0, patch: 1 }, CLOUDTYPE.INFINITESCALE],
            [false, { major: 99, minor: 0, patch: 1 }, CLOUDTYPE.OPENCLOUD],
            // Defaults for a not yet configured account
            [true, "", CLOUDTYPE.OTHER],
            [true, undefined, CLOUDTYPE.OTHER],
            [true, "", ""],
            [true, "", undefined],
            [true, undefined, ""],
            // Generally unsupported cloud type
            [false, "34.0.3", CLOUDTYPE.OTHER],
            [false, "0.0.0", CLOUDTYPE.OTHER],
            [false, "invalid", CLOUDTYPE.OTHER],
        ])("returns %s when the version is %s for %s", ([expected, versionstring, cloudtype]) => {
            const cc = mockedCloudCapabilities(versionstring, cloudtype);
            expect(cc.supported_version).toBe(expected);
        });
    })
})
