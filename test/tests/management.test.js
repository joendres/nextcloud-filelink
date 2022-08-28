import { Localize } from "../../src/common/localize.js";
import { FormHandler } from "../../src/management/formhandler.js";
import { run } from "../../src/management/management.js";
const expect = chai.expect;

describe("management.js", () => {
    describe('run', () => {
        beforeEach(() => {
            sinon.stub(FormHandler.prototype);
            sinon.stub(Localize, "addLocalizedLabels");
        });
        afterEach(sinon.restore);

        it("calls Localize.addLocalizedLabels", async () => {
            await run();
            expect(Localize.addLocalizedLabels.calledOnce).to.be.true;
        });
        it.skip("creates a new Formhandler", async () => {
            await run();
            expect.fail("can't spy on constructor?");
        });
        it("calls formHandler.addListeners", async () => {
            await run();
            expect(FormHandler.prototype.addListeners.calledOnce).to.be.true;
        });
        it("calls await formHandler.fillData", async () => {
            await run();
            expect(FormHandler.prototype.fillData.calledOnce).to.be.true;
        });
        it("calls formHandler.showErrors", async () => {
            await run();
            expect(FormHandler.prototype.showErrors.calledOnce).to.be.true;
        });
        it("calls formHandler.updateHeader", async () => {
            await run();
            expect(FormHandler.prototype.updateHeader.calledOnce).to.be.true;
        });
    });
});
