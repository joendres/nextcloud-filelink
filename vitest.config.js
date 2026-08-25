// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        coverage: {
            provider: 'istanbul',
            include: ['src/**/*.js'],
            exclude: ['src/vendor/**', 'src/photon-components-web/**',]
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    environment: "jsdom",
                    include: ["tests/unit/**/*.test.js"],
                },
            },
            {
                extends: true,
                test: {
                    name: "browser",
                    include: ["tests/browser/**/*.test.js"],
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        headless: true,
                        instances: [{ browser: "firefox" }],
                        screenshotFailures: false,
                    },
                },
            },
        ],
    },
});
