import { CloudUploader } from "../../src/background/clouduploader.js";
import { allAbortControllers, EventHandlers } from "../../src/background/eventhandlers.js";
import { Status } from "../../src/background/status.js";
import { CloudAccount } from "../../src/common/cloudaccount.js";
const expect = chai.expect;

describe("EventHandlers", () => {
    describe('onFileUpload', () => {
        /* async */
        beforeEach(() => {
            sinon.stub(CloudUploader.prototype, "load");
            sinon.stub(CloudUploader.prototype, "uploadFile").resolves({ url: "http://example.com", });
        });

        afterEach(sinon.restore);

        it("creates a CloudUploader", async () => {
            const save = Object.getPrototypeOf(CloudUploader);
            const fake = sinon.fake();
            Object.setPrototypeOf(CloudUploader, fake);
            const account = { id: "account1", };
            const id = "42";
            const name = "filename";
            const data = "data";
            await EventHandlers.onFileUpload(account, { id, name, data });
            expect(fake.called).to.be.true;
            Object.setPrototypeOf(CloudUploader, save);
        });
        it("loads its configuration", async () => {
            const account = { id: "account1", };
            const id = "42";
            const name = "filename";
            const data = "data";
            await EventHandlers.onFileUpload(account, { id, name, data });
            expect(CloudUploader.prototype.load.calledOnce).to.be.true;
        });
        it("calls its uploadFile method", async () => {
            const account = { id: "account1", };
            const id = "42";
            const name = "filename";
            const data = "data";
            await EventHandlers.onFileUpload(account, { id, name, data });
            expect(CloudUploader.prototype.uploadFile.calledOnce).to.be.true;
            expect(CloudUploader.prototype.uploadFile.lastCall.args[0]).to.deep.equal(`${account.id}_${id}`);
            expect(CloudUploader.prototype.uploadFile.lastCall.args[1]).to.equal(name);
            expect(CloudUploader.prototype.uploadFile.lastCall.args[2]).to.equal(data);
        });
    });

    describe('onFileUploadAbort', () => {
        const abort_fake = sinon.fake();
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(allAbortControllers, "get").returns({ abort: abort_fake, });
            sinon.stub(Status, "remove");
        });
        it("calls abort of the corresponding abortController if it exists", () => {
            EventHandlers.onFileUploadAbort({ id: "account", }, 42);
            expect(allAbortControllers.get.calledOnce).to.be.true;
            expect(allAbortControllers.get.lastCall.firstArg).to.equal("account_42");
            expect(abort_fake.calledOnce).to.be.true;
        });
        it("removes the upload from the Status map", () => {
            EventHandlers.onFileUploadAbort({ id: "account", }, 42);
            expect(Status.remove.calledOnce).to.be.true;
            expect(Status.remove.lastCall.firstArg).to.equal("account_42");
        });
    });

    describe('onFileDeleted', () => {
        beforeEach(() => {
            sinon.stub(Status, "remove");
        });
        afterEach(sinon.restore);

        it("removes the upload from the Status map", () => {
            EventHandlers.onFileDeleted({ id: "account", }, "42");
            expect(Status.remove.lastCall.firstArg).to.equal("account_42");
        });
    });

    describe('onAccountAdded', () => {
        it("is not a method of EventHandlers", () => {
            expect(EventHandlers).not.to.respondTo("onAccountAdded");
            expect(EventHandlers).itself.not.to.respondTo("onAccountAdded");
        });
    });

    describe('onAccountDeleted', () => {
        beforeEach(() => {
            sinon.stub(CloudAccount.prototype, "deleteAccount");
        });
        afterEach(sinon.restore);

        it("creates a CloudAccount"
            /** @todo Why does the method used above to install a fake constructor not work here? */
        );
        it("calls CloudAccount.deleteAccount for the account", () => {
            EventHandlers.onAccountDeleted("account1");
            expect(CloudAccount.prototype.deleteAccount.calledOnce).to.be.true;
        });
    });
});

/** @todo How to test function not exported from es6 module? */
/* makeUploadId */