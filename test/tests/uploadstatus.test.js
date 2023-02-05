// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { UploadStatus } from "../../src/common/uploadstatus.js";
import { Statuses } from "../../src/common/statuses.js";
const expect = chai.expect;

describe("UploadStatus", () => {
    describe("constructor", () => {
        it("sets the expected values", () => {
            const us = new UploadStatus("filename");
            expect(us).to.eql({
                filename: "filename",
                status: Statuses.PREPARING,
                progress: 0,
                error: false,
            });
        });
    });
});