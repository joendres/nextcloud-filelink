import { Localize } from "../../src/common/localize.js";
import { ComPort } from "../../src/compose_action/comport.js";

const expect = chai.expect;

describe("progress.js", () => {
    before(async () => {

        sinon.stub(Localize, "addLocalizedLabels");
        sinon.stub(ComPort, "setup");

        await import("../../src/compose_action/progress.js");
    });
    after(sinon.restore);

    it("localizes all labels", () => {
        expect(Localize.addLocalizedLabels.calledOnce).to.be.true;
    });
    it('Sets up the port to the background worker', () => {
        expect(ComPort.setup.calledOnce).to.be.true;
    });
});
