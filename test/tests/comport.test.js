import { ComPort } from "../../src/compose_action/comport.js";
import { StatusDisplay } from "../../src/compose_action/statusdisplay.js";
const expect = chai.expect;

describe("ComPort", () => {
    describe("setup", () => {
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
            delete ComPort.port;
        });

        it("is a static method", () => {
            expect(ComPort).itself.to.respondTo("setup");
        });
        it("is not an async method", () => {
            expect(ComPort.setup()).not.to.be.a("Promise");
        });
        it("sets up port", () => {
            ComPort.setup();
            expect(browser.runtime.connect.calledOnce).to.be.true;
        });
        it("installs the update handler", () => {
            ComPort.setup();
            expect(browser.runtime.connect().onMessage.addListener.calledOnce).to.be.true;
            expect(browser.runtime.connect().onMessage.addListener.lastCall.firstArg).to.equal(StatusDisplay.update);
        });
        it("sends the 'update' message", () => {
            ComPort.setup();
            expect(browser.runtime.connect().postMessage.calledOnce).to.be.true;
            expect(browser.runtime.connect().postMessage.lastCall.firstArg).to.equal("update");
        });
        it("adds the handler to the clear button", () => {
            ComPort.setup();
            const button = document.querySelector("#button_clear");
            expect(button.onclick).to.equal(ComPort.clearButtonHandler);
        });
    });

    describe("clearButtonHandler", () => {
        beforeEach(() => {
            ComPort.port = { postMessage: sinon.fake(), };
        });
        afterEach(() => {
            delete ComPort.port;
        });

        it("is a static method", () => {
            expect(ComPort).itself.to.respondTo("clearButtonHandler");
        });
        it("is not an async method", () => {
            expect(ComPort.clearButtonHandler()).not.to.be.a("Promise");
        });
        it("sends the clearcomplete message", () => {
            ComPort.clearButtonHandler();
            expect(ComPort.port.postMessage.calledOnce).to.be.true;
            expect(ComPort.port.postMessage.lastCall.firstArg).to.equal("clearcomplete");
        });
    });
});