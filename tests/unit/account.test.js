// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { describe, it, vi, beforeEach, expect, afterEach } from "vitest";
import { Account } from "../../src/lib/account.js";

describe('Account', () => {
    beforeEach(() => {
        globalThis.browser = {
            storage: {
                local: {
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

    describe('updateConfigured', () => {

        beforeEach(() => {
            globalThis.messenger = {
                cloudFile: {
                    updateAccount: vi.fn().mockResolvedValue(undefined),
                },
            };
        })

        afterEach(() => {
            delete globalThis.messenger;
        })

        function setupAccountAndCapabilities() {
            const account = new Account("test");
            const capabilities = {
                public_shares_enabled: true,
                enforce_password: false,
                expiry_max_days: 0,
                no_download_links: false,
            };

            account.updateAndStore({
                serverUrl: "https://www.example.com",
                username: "dummy",
                password: "password",
                userId: "dummy",
                storageFolder: "/storage",
                useDlPassword: false,
                useExpiry: false,
            });

            return { account, capabilities };
        }

        it('sets configured to true if everything is OK.', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: true },
            );
        })

        it.for([
            ["serverUrl"],
            ["username"],
            ["password"],
            ["userId"],
            ["storageFolder"],
        ])("sets false if %s is invalid", async ([key]) => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account[key] = "";
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it('sets false if a password should be used but none is supplied.', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useDlPassword = true;
            account.useGeneratedDlPassword = false;
            account.downloadPassword = false;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it('sets false if a generated password should be used', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useDlPassword = true;
            account.useGeneratedDlPassword = true;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: true },
            );
        })

        it('sets true if a single password is valid', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useDlPassword = true;
            account.downloadPassword = "password";
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: true },
            );
        })

        it('sets false if a single password is invalid', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useDlPassword = true;
            account.downloadPassword = "";
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it.for([
            [false, undefined],
            [false, 0],
            [false, ""],
            [true, 7],
        ])("sets %s if expiry ist to be set and expiryDays is %s", async ([result, expiryDays]) => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.expiryDays = expiryDays;
            account.useExpiry = true;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: result },
            );
        })

        it('sets false if sharing is disabled', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            capabilities.public_shares_enabled = false;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it('sets false if the cloud requires a password but none is configured', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useDlPassword = false;
            capabilities.enforce_password = true;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it('sets false if the cloud requires an expiry but none is configured', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useExpiry = false;
            account.expiryDays = 7;
            capabilities.expiry_max_days = 7;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })
        it('sets false if the cloud requires an expiry but it is to long', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.useExpiry = true;
            account.expiryDays = 70;
            capabilities.expiry_max_days = 7;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

        it('sets false if the cloud does not support download links but they are active', async () => {
            const { account, capabilities } = setupAccountAndCapabilities();
            account.noAutoDownload = false;
            capabilities.no_download_links = true;
            await account.updateConfigured(capabilities);
            expect(messenger.cloudFile.updateAccount).toHaveBeenCalledWith(
                expect.anything(),
                { configured: false },
            );
        })

    })

    describe('hasLoginData', () => {
        function makeValidLoginData() {
            const account = new Account("test");
            account.updateAndStore({
                serverUrl: "https://www.example.com/",
                username: "user",
                password: "pass",
            });
            return account;
        }
        it.for([
            [false, ""],
            [false, undefined],
            [true, "user"],
        ])("returns %s for username '%s'", ([expected, username]) => {
            const account = makeValidLoginData();
            account.updateAndStore({ username });
            expect(account.hasLoginData()).toEqual(expected);
        })
        it.for([
            [false, ""],
            [false, undefined],
            [true, "Passwort"],
        ])("returns %s for password '%s'", ([expected, password]) => {
            const account = makeValidLoginData();
            account.updateAndStore({ password });
            expect(account.hasLoginData()).toEqual(expected);
        })
        it.for([
            [false, ""],
            [false, " "],
            [false, undefined],
            [true, "http://example.com"],
            [true, "http://example.com"],
            [false, "ftp://example.com"],
            [false, "example.com"],
        ])("returns %s for serverUrl '%s'", ([expected, serverUrl]) => {
            const account = makeValidLoginData();
            account.updateAndStore({ serverUrl });
            expect(account.hasLoginData()).toEqual(expected);
        })
        it('returns false for an empty Account', () => {
            const account = new Account("arguments");
            expect(account.hasLoginData()).toEqual(false);
        })

    })

})
