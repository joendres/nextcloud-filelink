import { ComPort } from "../../src/compose_action/comport.js";
const expect = chai.expect;

describe.only('ComPort', () => {
    describe('setup', () => {
        let save;
        beforeEach(() => {
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
        });
        afterEach(() => {
            sinon.restore();
            browser.runtime = save;
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
        it("adds the handler to the clear button", () => {
            const button = document.querySelector("#button_clear");
            expect(!!button.onclick).to.be.true;
        });
    });

    describe('clearButtonHandler', () => {
    });
});