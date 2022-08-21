import { MessageDispatcher } from "../../src/background/messagedispatcher.js";
import { Status } from "../../src/background/status.js";
const expect = chai.expect;

describe("MessageDispatcher", () => {

    describe('installHandler', () => {
        afterEach(sinon.restore);

        beforeEach(() => {
            browser.runtime.onConnect.addListener = sinon.fake();
        });

        it("installs the handler", () => {
            browser.runtime.onConnect.hasListener = sinon.fake.returns(false);
            MessageDispatcher.installHandler();
            expect(browser.runtime.onConnect.addListener.called).to.be.true;
            expect(browser.runtime.onConnect.addListener.lastCall.firstArg).to.equal(MessageDispatcher.connectHandler);
        });
        it("doesn't install the handler if its already installed", () => {
            browser.runtime.onConnect.hasListener = sinon.fake.returns(true);
            MessageDispatcher.installHandler();
            expect(browser.runtime.onConnect.addListener.called).to.be.false;
        });
    });

    describe('connectHandler', () => {
        let thePort = {
            onDisconnect: {},
            onMessage: {},
        };

        afterEach(sinon.restore);

        beforeEach(() => {
            thePort.onDisconnect.addListener = sinon.fake();
            thePort.onMessage.addListener = sinon.fake();
        });

        it("stores the port in the Status class", () => {
            delete Status.port;
            MessageDispatcher.connectHandler(thePort);
            expect(Status.port).to.deep.equal(thePort);
        });
        it("installs a disconnect handler", () => {
            MessageDispatcher.connectHandler(thePort);
            expect(thePort.onDisconnect.addListener.called).to.be.true;
            expect(thePort.onDisconnect.addListener.lastCall.firstArg).to.equal(MessageDispatcher.closePort);
        });
        it("installs the dispatcher as handler", () => {
            MessageDispatcher.connectHandler(thePort);
            expect(thePort.onMessage.addListener.called).to.be.true;
            expect(thePort.onMessage.addListener.lastCall.firstArg).to.equal(MessageDispatcher.dispatch);
        });
    });

    describe('closePort', () => {
        it("Sets Status.port to null", () => {
            Status.port = "notnull";
            MessageDispatcher.closePort();
            expect(Status.port).to.be.null;
        });
    });

    describe('dispatch', () => {
        afterEach(sinon.restore);

        it("dispatches the update command", () => {
            sinon.stub(Status, "update");
            MessageDispatcher.dispatch("update");
            expect(Status.update.called).to.be.true;
        });

        it("dispatches the clearcomplete command", () => {
            sinon.stub(Status, "clearcomplete");
            MessageDispatcher.dispatch("clearcomplete");
            expect(Status.clearcomplete.called).to.be.true;
        });
        it("throws a ReferenceError on add command", () => {
            expect(() => MessageDispatcher.dispatch("add")).to.throw(ReferenceError, "No handler for add");
        });
        it("throws a ReferenceError on another command", () => {
            expect(() => MessageDispatcher.dispatch("the_Spanish_inquisition")).to.throw(ReferenceError, "No handler for the_Spanish_inquisition");
        });
    });
});
