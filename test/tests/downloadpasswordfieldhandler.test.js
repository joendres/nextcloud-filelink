import { CloudAccount } from "../../src/common/cloudaccount.js";
import { DownloadPasswordFieldHandler } from "../../src/management/downloadpasswordfieldhandler.js";
import { FormHandler } from "../../src/management/formhandler.js";
import { Popup } from "../../src/management/popup/popup.js";
const expect = chai.expect;

describe("DownloadPasswordFieldHandler", () => {
    let advanced_options;
    let downloadPassword;
    let oneDLPassword;
    let useGeneratedDlPassword;
    let useNoDlPassword;

    beforeEach(() => {
        advanced_options = document.createElement("details");
        downloadPassword = document.createElement("input");
        oneDLPassword = document.createElement("input");
        useGeneratedDlPassword = document.createElement("input");
        useNoDlPassword = document.createElement("input");
        sinon.stub(document, "querySelector").
            withArgs("#advanced_options").returns(advanced_options).
            withArgs("#downloadPassword").returns(downloadPassword).
            withArgs("#oneDLPassword").returns(oneDLPassword).
            withArgs("#useGeneratedDlPassword").returns(useGeneratedDlPassword).
            withArgs("#useNoDlPassword").returns(useNoDlPassword);
        sinon.stub(document, "getElementsByName").returns([oneDLPassword, useGeneratedDlPassword, useNoDlPassword,]);
        sinon.stub(FormHandler, "updateButtons");
    });

    afterEach(() => {
        sinon.restore();
        advanced_options.remove();
        downloadPassword.remove();
        oneDLPassword.remove();
        useGeneratedDlPassword.remove();
        useNoDlPassword.remove();
    });

    describe('addListeners', () => {
        it("is a static method", () => {
            expect(DownloadPasswordFieldHandler).itself.to.respondTo("addListeners");
        });
        it("adds the handler to oneDLPassword", () => {
            sinon.stub(oneDLPassword, "addEventListener");
            DownloadPasswordFieldHandler.addListeners();
            expect(oneDLPassword.addEventListener.called).to.be.true;
            expect(oneDLPassword.addEventListener.lastCall.firstArg).to.equal("change");
            expect(oneDLPassword.addEventListener.lastCall.lastArg).to.equal(DownloadPasswordFieldHandler.syncInputStateToRadio);
        });
        it("adds the handler to useGeneratedDlPassword", () => {
            sinon.stub(useGeneratedDlPassword, "addEventListener");
            DownloadPasswordFieldHandler.addListeners();
            expect(useGeneratedDlPassword.addEventListener.called).to.be.true;
            expect(useGeneratedDlPassword.addEventListener.lastCall.firstArg).to.equal("change");
            expect(useGeneratedDlPassword.addEventListener.lastCall.lastArg).to.equal(DownloadPasswordFieldHandler.syncInputStateToRadio);
        });
        it("adds the handler to useNoDlPassword", () => {
            sinon.stub(useNoDlPassword, "addEventListener");
            DownloadPasswordFieldHandler.addListeners();
            expect(useNoDlPassword.addEventListener.called).to.be.true;
            expect(useNoDlPassword.addEventListener.lastCall.firstArg).to.equal("change");
            expect(useNoDlPassword.addEventListener.lastCall.lastArg).to.equal(DownloadPasswordFieldHandler.syncInputStateToRadio);
        });
    });

    describe('syncInputStateToRadio', () => {
        it("is a static method", () => {
            expect(DownloadPasswordFieldHandler).itself.to.respondTo("syncInputStateToRadio");
        });
        it("disables downloadPassword if oneDLPassword is not checked", () => {
            oneDLPassword.checked = false;
            DownloadPasswordFieldHandler.syncInputStateToRadio();
            expect(downloadPassword.disabled).to.be.true;
        });
        it("enables downloadPassword if oneDLPassword is checked", () => {
            oneDLPassword.checked = true;
            DownloadPasswordFieldHandler.syncInputStateToRadio();
            expect(downloadPassword.disabled).to.be.false;
        });
        it("requires downloadPassword if oneDLPassword is checked", () => {
            oneDLPassword.checked = true;
            DownloadPasswordFieldHandler.syncInputStateToRadio();
            expect(downloadPassword.required).to.be.true;
        });
        it("doesn't require downloadPassword if oneDLPassword is not checked", () => {
            oneDLPassword.checked = false;
            DownloadPasswordFieldHandler.syncInputStateToRadio();
            expect(downloadPassword.required).to.be.false;
        });
        it("calls updateButtons", () => {
            DownloadPasswordFieldHandler.syncInputStateToRadio();
            expect(FormHandler.updateButtons.calledOnce).to.be.true;
        });
    });

    describe('fillData', () => {
        beforeEach(() => {
            sinon.stub(Popup, "error");
            sinon.stub(DownloadPasswordFieldHandler, "syncInputStateToRadio");
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(DownloadPasswordFieldHandler).itself.to.respondTo("fillData");
        });
        it("enables useNoDlPassword if password is not enforced", () => {
            const account = { enforce_password: false, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(useNoDlPassword.disabled).to.be.false;
        });
        it("disables useNoDlPassword if password is enforced", () => {
            const account = { enforce_password: true, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(useNoDlPassword.disabled).to.be.true;
        });
        it("unchecks useNoDlPassword if password is enforced", () => {
            useNoDlPassword.checked = true;
            const account = { enforce_password: true, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(useNoDlPassword.checked).to.be.false;
        });
        it("checks useGeneratedDlPassword if useNoDlPassword was checked and password is enforced", () => {
            useNoDlPassword.checked = true;
            const account = { enforce_password: true, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(useGeneratedDlPassword.checked).to.be.true;
        });
        it("opens advanced_options if useNoDlPassword was checked and password is enforced", () => {
            useNoDlPassword.checked = true;
            const account = { enforce_password: true, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(advanced_options.open).to.be.true;
        });
        it("opens an error popup if useNoDlPassword was checked and password is enforced", () => {
            useNoDlPassword.checked = true;
            const account = { enforce_password: true, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(Popup.error.calledOnce).to.be.true;
            expect(Popup.error.lastCall.firstArg).to.equal("password_enforced");
        });
        it("calls syncInputStateToRadio in every execution path", () => {
            useNoDlPassword.checked = true;
            const account = { enforce_password: false, };
            DownloadPasswordFieldHandler.fillData(account);
            expect(DownloadPasswordFieldHandler.syncInputStateToRadio.callCount).to.be.equal(1);
            useNoDlPassword.checked = true;
            account.enforce_password = true;
            DownloadPasswordFieldHandler.fillData(account);
            expect(DownloadPasswordFieldHandler.syncInputStateToRadio.callCount).to.be.equal(2);
            useNoDlPassword.checked = false;
            account.enforce_password = false;
            DownloadPasswordFieldHandler.fillData(account);
            expect(DownloadPasswordFieldHandler.syncInputStateToRadio.callCount).to.be.equal(3);
            useNoDlPassword.checked = false;
            account.enforce_password = true;
            DownloadPasswordFieldHandler.fillData(account);
            expect(DownloadPasswordFieldHandler.syncInputStateToRadio.callCount).to.be.equal(4);
        });
    });

    describe('postCloudUpdate', () => {
        // It's async!

        beforeEach(() => {
            sinon.stub(Popup, "error");
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(DownloadPasswordFieldHandler).itself.to.respondTo("postCloudUpdate");
        });
        it("doesn't call validateDLPassword if oneDLPassword is not checked", async () => {
            const account = { validateDLPassword: sinon.fake.resolves(false), errmsg: "error", };
            oneDLPassword.checked = false;
            await DownloadPasswordFieldHandler.postCloudUpdate(account);
            expect(account.validateDLPassword.called).to.be.false;
        });
        it("calls validateDLPassword if oneDLPassword is checked", async () => {
            const account = { validateDLPassword: sinon.fake.resolves(false), errmsg: "error", };
            oneDLPassword.checked = true;
            await DownloadPasswordFieldHandler.postCloudUpdate(account);
            expect(account.validateDLPassword.called).to.be.true;
        });
        it("opens an error Popup if validateDLPassword returns false", async () => {
            const account = { validateDLPassword: sinon.fake.resolves(false), errmsg: "error", };
            oneDLPassword.checked = true;
            await DownloadPasswordFieldHandler.postCloudUpdate(account);
            expect(Popup.error.calledOnce).to.be.true;
            expect(Popup.error.lastCall.firstArg).to.equal("invalid_pw");
        });
        it("does not open an error Popup if validateDLPassword returns true", async () => {
            const account = { validateDLPassword: sinon.fake.resolves(true), errmsg: "none", };
            oneDLPassword.checked = true;
            await DownloadPasswordFieldHandler.postCloudUpdate(account);
            expect(Popup.error.called).to.be.false;
        });
    });
});
