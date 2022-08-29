import { AccountUpdater } from "../../src/background/accountupdater.js";
import { MessageDispatcher } from "../../src/background/messagedispatcher.js";
import { TBVersionWorkarounds } from "../../src/background/tbversionworkarounds.js";
import { EventHandlers } from "../../src/background/eventhandlers.js";
import { main } from "../../src/background/background.js";

const expect = chai.expect;

describe.only("background.js", () => {
    describe('main', () => {
        const event_handlers = [
            ["onFileUpload", "onFileUpload"],
            ["onFileUploadAbort", "onFileUploadAbort"],
            ["onFileDeleted", "onFileDeleted"],
            ["onAccountAdded", "onAccountAdded"],
            ["onAccountDeleted", "onAccountDeleted"],
        ];
        beforeEach(() => {
            sinon.stub(AccountUpdater, "update_all");
            sinon.stub(TBVersionWorkarounds, "apply_all");
            sinon.stub(MessageDispatcher, "installHandler");
            event_handlers.forEach(([event, handler]) => {
                browser.cloudFile[event].removeListener(EventHandlers[handler]);
            });
        });
        afterEach(() => {
            sinon.restore();
            event_handlers.forEach(([event, handler]) => {
                browser.cloudFile[event].removeListener(EventHandlers[handler]);
            });
        });

        it("Updates all configures accounts", () => {
            main();
            expect(AccountUpdater.update_all.calledOnce).to.be.true;
        });
        it("installs workarounds for Thunderbird version dependencies", () => {
            main();
            expect(TBVersionWorkarounds.apply_all.calledOnce).to.be.true;
        });
        it("installs the dispatcher for messages from the progress popup", () => {
            main();
            expect(MessageDispatcher.installHandler.calledOnce).to.be.true;
        });
        event_handlers.forEach(([event, handler]) => {
            main();
            it(`installs EventHandlers.${handler} to handle ${event}`, () => {
                expect(browser.cloudFile[event].hasListener(EventHandlers[handler])).to.be.true;
            });
        });
    });
    /** @todo Add tests */
});
