import { Utils } from "../../src/background/utils.js";

describe("Utils.encodepath", () => {
    it("should return the input sting if it contains allowed characters only", () => {
        const test_string = "/ABC/DEF/GHI/JKL/MNO/PQR/STU/VWX/YZ_abcdefghijklmnopqrstuvwxyz-0123456789/../.";
        expect(Utils.encodepath(test_string)).to.equal(test_string);
    });
    it("should reproduce empty path parts", () => {
        expect(Utils.encodepath("///")).to.equal("///");
    });
    it("should encode common special characters", () => {
        expect(Utils.encodepath("/;,?:@&=+$/")).to.equal("/%3B%2C%3F%3A%40%26%3D%2B%24/");
    });
    it("should encode some extra characters: ~*'", () => {
        expect(Utils.encodepath("!()~*'")).to.equal("%21%28%29%7e%2a%27");
    });
});

describe("Utils.promisedTimeout", () => {
    /** @todo */
});
