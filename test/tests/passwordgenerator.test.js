import { PasswordGenerator } from "../../src/background/passwordgenerator.js";

describe("PasswordGenerator.generate", () => {
    it("Should return a string of at least 4 characters", () => {
        expect(PasswordGenerator.generate(0)).to.have.lengthOf(4);
    });
    it("Should return a string of 12 characters if called without parameter", () => {
        expect(PasswordGenerator.generate()).to.have.lengthOf(12);
    });
    it("Should return a string of the requested length", () => {
        expect(PasswordGenerator.generate(16)).to.have.lengthOf(16);
    });
    it("Should return a string that contains a lowercase letter", () => {
        expect(PasswordGenerator.generate(0)).to.match(/[a-z]/);
    });
    it("Should return a string that contains an uppercase letter", () => {
        expect(PasswordGenerator.generate(0)).to.match(/[A-Z]/);
    });
    it("Should return a string that contains a number", () => {
        expect(PasswordGenerator.generate(0)).to.match(/\d/);
    });
    it("Should return a string that contains a punctuation mark", () => {
        expect(PasswordGenerator.generate(0)).to.match(/[-!"#$%&\\()*+,/:;=?@[\]^_{|}~]/);
    });
});