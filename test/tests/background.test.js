import { AccountUpdater } from "../../src/background/accountupdater.js";
import { MessageDispatcher } from "../../src/background/messagedispatcher.js";
import { TBVersionWorkarounds } from "../../src/background/tbversionworkarounds.js";
import { EventHandlers } from "../../src/background/eventhandlers.js";

const expect = chai.expect;

describe("background.js", () => {
    const event_handlers = [
        ["onFileUpload", "onFileUpload"],
        ["onFileUploadAbort", "onFileUploadAbort"],
        ["onFileDeleted", "onFileDeleted"],
        ["onAccountDeleted", "onAccountDeleted"],
    ];
    before(async () => {
        sinon.stub(AccountUpdater, "update_all");
        sinon.stub(TBVersionWorkarounds, "apply_all");
        sinon.stub(MessageDispatcher, "installHandler");
        sinon.stub(browser.cloudFile.onAccountAdded, "addListener");

        await import("../../src/background/background.js");
    });
    after(() => {
        sinon.restore();
        event_handlers.forEach(([event, handler]) => {
            browser.cloudFile[event].removeListener(EventHandlers[handler]);
        });
    });

    it("Updates all configured accounts", () => {
        expect(AccountUpdater.update_all.calledOnce).to.be.true;
    });
    it("installs workarounds for Thunderbird version dependencies", () => {
        expect(TBVersionWorkarounds.apply_all.calledOnce).to.be.true;
    });
    it("installs the dispatcher for messages from the progress popup", () => {
        expect(MessageDispatcher.installHandler.calledOnce).to.be.true;
    });
    event_handlers.forEach(([event, handler]) => {
        it(`installs EventHandlers.${handler} to handle ${event}`, () => {
            expect(browser.cloudFile[event].hasListener(EventHandlers[handler])).to.be.true;
        });
    });
    it("does not install a handler for onAccountAdded", () => {
        expect(browser.cloudFile.onAccountAdded.addListener.called).to.be.false;
    });
});