// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import vitest from '@vitest/eslint-plugin'

export default defineConfig([
    {
        // Configuration for the Addon sources
        files: ["src/**/*.{js,mjs,cjs}"],
        ignores: [
            "src/photon-components-web/**",
            "src/vendor/**",
        ],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            // The Addon supports Thunderbird 115, choose the correct ECMAScript version
            ecmaVersion: 2023,
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                // Use messenger instead of browser for Thunderbird API to keep
                // "web-ext lint" happy
                "messenger": "readonly",
            },
        },
        rules: {
            // In production the Addon should not write to the console
            "no-console": "error",
            "no-unused-vars": [
                "error",
                {
                    // Use _ as the variable name for errors in a catch that will be
                    // ignored afterwards
                    "caughtErrorsIgnorePattern": "^_$"
                }],
            // Rules, webext-linter adds to js/recommended
            "no-shadow": "warn",
            "no-self-compare": "warn",
            // Improve handling of async/await
            "no-await-in-loop": "off", // In this project the loops usually have no potential for parallelism
            "require-await": "warn",
            "require-atomic-updates": "error",
            // More rules for cleaner code
            "complexity": ["warn", { "max": 10, "variant": "modified", },],
            "class-methods-use-this": "warn",
            "curly": "error",
            "default-param-last": ["error"],
            "eqeqeq": ["error", "smart"],
            "no-else-return": "warn",
            "no-eval": "error",
            "no-implicit-globals": "error",
            "no-invalid-this": "error",
            "no-lonely-if": "warn",
            "no-return-assign": "error",
            "no-sequences": "error",
            "no-throw-literal": "error",
            "no-unneeded-ternary": "warn",
            "no-useless-computed-key": "warn",
            "no-var": "error",
            "operator-assignment": "warn",
            "prefer-const": "warn",
            // Find TODO and similar
            "no-warning-comments": "error",
        }
    },
    {
        files: ['tests/**'], // or any other pattern
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
            "vitest/warn-todo": "warn",
        },
    },
]);
