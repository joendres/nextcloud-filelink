import { Localize } from "../../src/common/localize.js";
import { StatusDisplay } from "../../src/compose_action/statusdisplay.js";

const expect = chai.expect;

describe.only("progress.js", () => {
    let save;
    before(async () => {
        const button_clear = document.createElement("button");
        sinon.stub(document, "querySelector").
            withArgs("#button_clear").
            returns(button_clear);

        save = browser.runtime;
        browser.runtime = {
            connect: sinon.fake.returns({
                onMessage: { addListener: sinon.fake(), },
                postMessage: sinon.fake(),
            })
        };

        sinon.stub(Localize, "addLocalizedLabels");

        await import("../../src/compose_action/progress.js");
    });
    after(() => {
        browser.runtime = save;
        sinon.restore();
    });

    it("sets up port", () => {
        expect(browser.runtime.connect.calledOnce).to.be.true;
    });
    it("installs the update handler", () => {
        expect(browser.runtime.connect().onMessage.addListener.calledOnce).to.be.true;
        expect(browser.runtime.connect().onMessage.addListener.lastCall.firstArg).to.equal(StatusDisplay.update);
    });
    it("sends the 'update' message", () => {
        expect(browser.runtime.connect().postMessage.calledOnce).to.be.true;
        expect(browser.runtime.connect().postMessage.lastCall.firstArg).to.equal("update");
    });
    it("localizes all labels", () => {
        expect(Localize.addLocalizedLabels.calledOnce).to.be.true;
    });
    it("adds the handler to the clear button", () => {
        const button = document.querySelector("#button_clear");
        expect(!!button.onclick).to.be.true;
    });
});
