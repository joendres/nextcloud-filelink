// Copyright (C) 2024 Johannes Endres
//
// SPDX-License-Identifier: MIT

import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "**/src/background/punycode.es6.js",
      "**/src/photon-components-web/",
      "**/src/punycode/",
      "**/*config.*js",
    ]
  },
  {
    languageOptions: {
      // Currently we still support Thunderbird 68.2.1 which has an old JS engine
      ecmaVersion: 9,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        // Use messenger instead of browser for Thunderbird API to keep
        // "web-ext lint" happy
        "messenger": "readonly",
      }
    }
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": [
        "error",
        {
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_$"
        }],
    }
  },
  {
    files: ["build-tools/**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "module"
    },
  },
];