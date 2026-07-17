// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT

import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

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
    }
  },
  {
    // Configuration for the build tools
    files: ["build-tools/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
    }
  },
]);
