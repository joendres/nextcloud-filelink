// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Statuses } from "../../src/common/statuses.js";
const expect = chai.expect;

describe("Statuses",()=>{
    it("is frozen",()=>{
        expect(Statuses).to.be.frozen;
    });
    it("has the expected content",()=>{
        expect(Statuses).to.deep.equal({
            CHECKINGSPACE: "checkingspace",
            CREATING: "creating",
            GENERATEDPASSWORD: "generatedpassword",
            MOVING: "moving",
            PREPARING: "preparing",
            SHARING: "sharing",
            UPLOADING: "uploading",
        });
    });
});
