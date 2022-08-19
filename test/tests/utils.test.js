import { Utils } from "../../src/common/utils.js";
const expect = chai.expect;

describe("Utils", () => {
    describe("encodepath", () => {
        it("returns the input sting if it contains allowed characters only", () => {
            const test_string = "/ABC/DEF/GHI/JKL/MNO/PQR/STU/VWX/YZ_abcdefghijklmnopqrstuvwxyz-0123456789/../.";
            expect(Utils.encodepath(test_string)).to.equal(test_string);
        });
        it("reproduces empty path parts", () => {
            expect(Utils.encodepath("///")).to.equal("///");
        });
        it("encodes common special characters", () => {
            expect(Utils.encodepath("/;,?:@&=+$/")).to.equal("/%3B%2C%3F%3A%40%26%3D%2B%24/");
        });
        it("encodes some extra characters: !()*'", () => {
            expect(Utils.encodepath("!()*'")).to.equal("%21%28%29%2a%27");
        });
    });

    describe("encodeRFC3986", () => {
        it("returns the input sting if it contains allowed characters only", () => {
            const test_string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-0123456789...";
            expect(Utils.encodeRFC3986(test_string)).to.equal(test_string);
        });
        it("encodes common special characters", () => {
            expect(Utils.encodeRFC3986(";,?:@&=+$")).to.equal("%3B%2C%3F%3A%40%26%3D%2B%24");
        });
        it("encodes some extra characters: !()*'", () => {
            expect(Utils.encodeRFC3986("!()*'")).to.equal("%21%28%29%2a%27");
        });
    });
});