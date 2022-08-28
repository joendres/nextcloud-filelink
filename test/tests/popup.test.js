import { Popup } from "../../src/management/popup/popup.js";
import { Localize } from "../../src/common/localize.js";
const expect = chai.expect;

describe("Popup", () => {
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
        let clock;
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
        beforeEach(() => {
            const msg_container = document.createElement("div");
            const popup = document.createElement("div");
            let element = document.createElement("div");
            element.classList.add("popup_message");
            popup.appendChild(element);
            element = document.createElement("button");
            element.classList.add("msg_bar_closebtn");
            popup.appendChild(element);
            sinon.stub(document, "querySelector").
                withArgs("#msg_container").returns(msg_container).
                withArgs(sinon.match(/^#\w+_popup$/)).returns(popup);
        });
        afterEach(sinon.restore);
        it("fetches the template", () => {
            Popup.openPopup("error", "error");
            expect(document.querySelector.withArgs("#error_popup").calledOnce).to.be.true;
            expect(document.querySelector.lastCall.firstArg).to.equal("#error_popup");
        });
        it("throws a TypeError if the template is missing", () => {
            sinon.restore();
            expect(() => Popup.openPopup("missing", "missing")).to.throw(TypeError);
        });
        it("adds the popup to the msg_container", () => {
            const spy = sinon.spy(document.querySelector("#msg_container"), "appendChild");

            Popup.openPopup("error", "error");
            expect(spy.calledOnce).to.be.true;
            expect(spy.lastCall.firstArg).to.be.a("HTMLDivElement");
        });
        it("returns the popup", () => {
            const p = Popup.openPopup("error", "error");
            expect(p).to.be.a("HTMLDivElement");
        });
        it("the popup contains the message", () => {
            const p = Popup.openPopup("error", "The Spanish Inquisition");
            expect(p.innerHTML).to.contain("The Spanish Inquisition");
        });
        it("the popup is not hidden", () => {
            const p = Popup.openPopup("error", "error");
            expect(p.hidden).to.be.false;
        });
        it("the click handler is attached to the button", () => {
            /** @type {HTMLDivElement} */
            const p = Popup.openPopup("error", "error");
            for (let i = 0; i < p.children.length; i++) {
                if ("BUTTON" === p.children[i].tagName) {
                    expect(p.children[i].onclick).to.equal(Popup.close);
                }
            }

        });
    });
    describe('close', () => {
        it("removes the popup that contains the close button", () => {
            const popup = document.createElement("div");
            const button = document.createElement("button");
            popup.appendChild(button);
            sinon.stub(popup, "remove");

            button.onclick = Popup.close;
            button.click();
            expect(popup.remove.calledOnce).to.be.true;

            sinon.restore();
        });
    });
    describe('clear', () => {
        let spy;
        beforeEach(() => {
            const msg_container = document.createElement("div");
            sinon.stub(document, "querySelector").returns(msg_container);
            spy = sinon.spy(Element.prototype, "remove");
        });
        afterEach(sinon.restore);
        it("removes an open popup", () => {
            document.querySelector().appendChild(document.createElement("div"));
            Popup.clear();
            expect(spy.callCount).to.equal(1);
            expect(document.querySelector().childElementCount).to.equal(0);
            expect(Popup.empty()).to.be.true;
        });
        it("removes three popups", () => {
            const mc = document.querySelector();
            mc.appendChild(document.createElement("div"));
            mc.appendChild(document.createElement("div"));
            mc.appendChild(document.createElement("div"));
            Popup.clear();
            expect(spy.callCount).to.equal(3);
            expect(document.querySelector().childElementCount).to.equal(0);
            expect(Popup.empty()).to.be.true;
        });
        it("does nothing if there is no open popup", () => {
            const mc = document.querySelector();
            const mc_before = mc.cloneNode(true);
            Popup.clear();
            expect(mc).to.deep.equal(mc_before);
        });
    });
    describe('empty', () => {
        beforeEach(() => {
            const msg_container = document.createElement("div");
            sinon.stub(document, "querySelector").returns(msg_container);
        });
        afterEach(sinon.restore);
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