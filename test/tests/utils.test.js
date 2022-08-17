import { Utils } from "../../src/background/utils.js";

describe("Utils.encodepath", () => {
    it("should return the input sting if it contains allowed characters only", () => {
        const test_string = "/ABC/DEF/GHI/JKL/MNO/PQR/STU/VWX/YZ_abcdefghijklmnopqrstuvwxyz-0123456789";
        expect(Utils.encodepath(test_string)).to.equal(test_string);
    });
    it("should encode common special characters", () => {
        expect(Utils.encodepath("/?& #/")).to.equal("/%3F%26%20%23/");
    });
    it("should reproduce empty path parts", () => {
        expect(Utils.encodepath("///")).to.equal("///");
    });
    it("should encode some extra characters: ~*'", () => {
        expect(Utils.encodepath("~*'")).to.equal("%7e%2a%27");
    });
});

describe("Utils.promisedTimeout", () => {
    /** @todo */
});
