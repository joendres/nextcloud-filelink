import { Popup } from "../../src/management/popup/popup.js";
import { Localize } from "../../src/common/localize.js";
const expect = chai.expect;

describe.only("Popup", () => {
    /** @todo Add tests */
    describe('error', () => {
        beforeEach(() => {
            sinon.stub(Popup, "openPopup");
            sinon.stub(Localize, "getErrorMessage");
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(Popup).itself.to.respondTo("error");
        });
        it("is a synchronous method", () => {
            expect(Popup.error("error")).not.to.be.a("Promise");
        });
        it("opens a popup with the template 'error'", () => {
            Popup.error("error");
            expect(Popup.openPopup.calledOnce).to.be.true;
            expect(Popup.openPopup.lastCall.firstArg).to.equal("error");
        });
        it("uses Localize.getErrorMessage to localize the error message", () => {
            Popup.error("error");
            expect(Localize.getErrorMessage.calledOnce).to.be.true;
            expect(Localize.getErrorMessage.lastCall.firstArg).to.equal("error");
        });
        it("puts all parameters after the first into the error message", () => {
            Popup.error("error", "a", "b", "c");
            expect(Localize.getErrorMessage.lastCall.lastArg).to.deep.equal(["a", "b", "c",]);
        });
    });
    describe('warn', () => {
        beforeEach(() => {
            sinon.stub(Popup, "openPopup");
            sinon.stub(Localize, "getWarningMessage");
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(Popup).itself.to.respondTo("warn");
        });
        it("is a synchronous method", () => {
            expect(Popup.warn("warn")).not.to.be.a("Promise");
        });
        it("opens a popup with the template 'warning'", () => {
            Popup.warn("warn");
            expect(Popup.openPopup.calledOnce).to.be.true;
            expect(Popup.openPopup.lastCall.firstArg).to.equal("warning");
        });
        it("uses Localize.getErrorMessage to localize the warning message", () => {
            Popup.warn("warn");
            expect(Localize.getWarningMessage.calledOnce).to.be.true;
            expect(Localize.getWarningMessage.lastCall.firstArg).to.equal("warn");
        });
        it("puts all parameters after the first into the warning message", () => {
            Popup.warn("warn", "a", "b", "c");
            expect(Localize.getWarningMessage.lastCall.lastArg).to.deep.equal(["a", "b", "c",]);
        });
    });
    describe('success', () => {
        var clock;
        beforeEach(() => {
            sinon.stub(Popup, "openPopup").returns({ remove: sinon.fake(), });
            sinon.stub(Localize, "getSuccessMessage");
            clock = sinon.useFakeTimers();
        });
        afterEach(() => {
            sinon.restore();
            clock.restore();
        });

        it("is a static method", () => {
            expect(Popup).itself.to.respondTo("success");
        });
        it("is an async method", () => {
            expect(Popup.success()).to.be.a("Promise");
        });
        it("opens a popup with the template 'success'", async () => {
            const prom = Popup.success();
            clock.tick(3000);
            await prom;
            expect(Popup.openPopup.calledOnce).to.be.true;
            expect(Popup.openPopup.lastCall.firstArg).to.equal("success");
        });
        it("uses Localize.getSuccessMessage to localize the message", async () => {
            const prom = Popup.success();
            clock.tick(3000);
            await prom;
            expect(Localize.getSuccessMessage.calledOnce).to.be.true;
        });
        it("removes the popup after 3 seconds", async () => {
            const prom = Popup.success();
            expect(Popup.openPopup().remove.called).to.be.false;
            clock.tick(3000);
            await prom;
            expect(Popup.openPopup().remove.calledOnce).to.be.true;
        });
    });
    describe('openPopup', () => {
        it("fetches the template");
        it("does nothing if the template is missing");
        it("clones the template");
        it("adds the message");
        it("makes the popup visible");
        it("adds the click handler to the button");
        it("adds the popup to the msg_container");
    });
    describe('close', () => {
        it("removes the popup that contains the close button");
    });
    describe('clear', () => {
        beforeEach(() => {
            const msg_container = {
                canary: "alive",
                open_popups: 1,
            };
            sinon.stub(document, "querySelector").returns(msg_container);
            msg_container.firstChild = {
                remove: sinon.fake(() => {
                    if (msg_container.firstChild.remove.callCount === msg_container.open_popups) {
                        delete msg_container.firstChild;
                    }
                })
            };
        });
        afterEach(() => {
            sinon.restore();
        });
        it("removes an open popup", () => {
            Popup.clear();
            expect(document.querySelector()).not.to.have.property("firstChild");
            expect(Popup.empty()).to.be.true;
        });
        it("removes three popups", () => {
            document.querySelector().open_popups = 3;
            Popup.clear();
            expect(document.querySelector()).not.to.have.property("firstChild");
            expect(Popup.empty()).to.be.true;
        });
        it("does nothing if there is no open popup", () => {
            const mc = document.querySelector();
            delete mc.firstChild;
            let mc_before = {};
            Object.assign(mc_before, mc);
            Popup.clear();
            expect(mc).to.deep.equal(mc_before);
        });
    });
    describe('empty', () => {
        beforeEach(() => {
            const msg_container = document.createElement("div");
            sinon.stub(document, "querySelector").returns(msg_container);
        });
        afterEach(() => {
            document.querySelector().remove();
            sinon.restore();
        });
        it("returns true if there is no popup visible", () => {
            expect(Popup.empty()).to.be.true;
        });
        it("returns false if there is a popup", () => {
            document.querySelector().appendChild(
                document.createElement("div")
            );
            expect(Popup.empty()).to.be.false;
        });
    });
});