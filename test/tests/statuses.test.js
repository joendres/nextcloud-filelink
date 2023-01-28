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
    for (const key in Statuses) {
        const status = Statuses[key];
        it.skip(`there is a string for ${status}`, () => {
            /** @todo This doesn't work because _locales is not in the correct directory */
            const message = browser.i18n.getMessage(`status_${status}`);
            expect(message).not.to.be.empty;
        });
    }
});
