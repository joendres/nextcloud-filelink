// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { PasswordGenerator } from "../../src/background/passwordgenerator.js";
const expect = chai.expect;

describe("PasswordGenerator", () => {
    describe("generate", () => {
        it("should return a string of at least 4 characters", () => {
            expect(PasswordGenerator.generate(0)).to.have.lengthOf(4);
        });
        it("should return a string of 12 characters if called without parameter", () => {
            expect(PasswordGenerator.generate()).to.have.lengthOf(12);
        });
        it("should return a string of the requested length", () => {
            expect(PasswordGenerator.generate(16)).to.have.lengthOf(16);
        });
        it("should return a string that contains a lowercase letter", () => {
            expect(PasswordGenerator.generate(0)).to.match(/[a-z]/);
        });
        it("should return a string that contains an uppercase letter", () => {
            expect(PasswordGenerator.generate(0)).to.match(/[A-Z]/);
        });
        it("should return a string that contains a number", () => {
            expect(PasswordGenerator.generate(0)).to.match(/\d/);
        });
        it("should return a string that contains a punctuation mark", () => {
            expect(PasswordGenerator.generate(0)).to.match(/[-!"#$%&\\()*+,/:;=?@[\]^_{|}~]/);
        });
        it("should treat negative parameter values  as 0", () => {
            expect(PasswordGenerator.generate(-10)).to.have.lengthOf(4);
        });
        it("should treat insensibly big parameter values as 0", () => {
            expect(PasswordGenerator.generate(Number.MAX_SAFE_INTEGER + 1)).to.have.lengthOf(4);
        });
    });
});