import { Localize } from "../../src/common/localize.js";
const expect = chai.expect;

describe("Localize", () => {
    describe('addLocalizedLabels', () => {
        let container;
        beforeEach(() => {
            container = document.createElement("div");
            container.setAttribute("hidden", true);
            container.innerHTML = getTestHTML();
            document.body.appendChild(container);
        });
        afterEach(() => {
            sinon.restore();
            container.remove();
        });
        it("is a static function", () => {
            expect(Localize).itself.to.respondTo("addLocalizedLabels");
        });
        it("is not an async function", () => {
            const save = browser.i18n;
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.addLocalizedLabels()).not.to.be.a("Promise");
            browser.i18n = save;
        });
        it("sets the textContent of all Elements to the localized messages", () => {
            const save = browser.i18n;
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };

            Localize.addLocalizedLabels();
            for (let index = 0; index < container.children.length; index++) {
                const element = container.children[index];
                expect(element.textContent).to.equal("localized");
            }
            browser.i18n = save;
        });
        it("sets the textContent to empty string if there is no localized message", () => {
            browser.i18n = { getMessage: sinon.fake.returns(""), };
            Localize.addLocalizedLabels();
            for (let index = 0; index < container.children.length; index++) {
                const element = container.children[index];
                expect(element.textContent).to.equal("");
            }
        });
    });
    describe('localizeMSGString', () => {
        it("is a static function", () => {
            expect(Localize).itself.to.respondTo("localizeMSGString");
        });
        it("is not an async function", () => {
            expect(Localize.localizeMSGString("xy")).not.to.be.a("Promise");
        });
        it("returns the input string if it is not in the correct format", () => {
            expect(Localize.localizeMSGString("test")).to.equal("test");
        });
        it("returns the input string if there is no localization for the selector", () => {
            browser.i18n = { getMessage: sinon.fake.returns(), };
            expect(Localize.localizeMSGString("__MSG_extensionName__")).to.equal("__MSG_extensionName__");
        });
        it("returns the localized string if it exists", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.localizeMSGString("__MSG_extensionName__")).to.equal("localized");
        });
    });
    describe('getErrorMessage', () => {
        it("is a static function", () => {
            expect(Localize).itself.to.respondTo("getErrorMessage");
        });
        it("is not an async function", () => {
            expect(Localize.getErrorMessage()).not.to.be.a("Promise");
        });
        it("returns the localized error message", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.getErrorMessage("error")).to.equal("localized");
            expect(browser.i18n.getMessage.calledOnce).to.be.true;
            expect(browser.i18n.getMessage.lastCall.firstArg).to.be.equal("error_error");
        });
        it("puts an additional string into the error message", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.getErrorMessage("error", "message")).to.equal("localized");
            expect(browser.i18n.getMessage.calledOnce).to.be.true;
            expect(browser.i18n.getMessage.lastCall.lastArg).to.be.equal("message");
        });
        it("returns localized error_0 if there is no message for the original error", () => {
            browser.i18n = { getMessage: sinon.fake.returns(""), };
            expect(Localize.getErrorMessage("error")).to.equal("");
            expect(browser.i18n.getMessage.calledTwice).to.be.true;
            expect(browser.i18n.getMessage.lastCall.firstArg).to.be.equal("error_0");
        });
    });
    describe('getWarningMessage', () => {
        it("is a static function", () => {
            expect(Localize).itself.to.respondTo("getWarningMessage");
        });
        it("is not an async function", () => {
            expect(Localize.getWarningMessage()).not.to.be.a("Promise");
        });
        it("returns the localized warning message", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.getWarningMessage("warn")).to.equal("localized");
            expect(browser.i18n.getMessage.calledOnce).to.be.true;
            expect(browser.i18n.getMessage.lastCall.firstArg).to.be.equal("warn_warn");
        });
        it("puts an additional string into the warning message", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.getWarningMessage("warn", "message")).to.equal("localized");
            expect(browser.i18n.getMessage.calledOnce).to.be.true;
            expect(browser.i18n.getMessage.lastCall.lastArg).to.be.equal("message");
        });

    });
    describe('getSuccessMessage', () => {
        it("is a static function", () => {
            expect(Localize).itself.to.respondTo("getSuccessMessage");
        });
        it("is not an async function", () => {
            expect(Localize.getSuccessMessage()).not.to.be.a("Promise");
        });
        it("returns the localized success message", () => {
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
            expect(Localize.getSuccessMessage("warn")).to.equal("localized");
            expect(browser.i18n.getMessage.calledOnce).to.be.true;
            expect(browser.i18n.getMessage.lastCall.firstArg).to.be.equal("success");
        });
    });
});

function getTestHTML() {
    return `
    <button data-message="saveButton"></button>
    <button id="button_clear" class="button--primary button--micro hidden" data-message="status_button_clear"></button>
    <button id="resetButton" class="button" type="reset" disabled data-message="resetButton"></button>
    <div class="card" data-message="expiry_details"></div>
    <div class="card" data-message="noAutoDownload_details"></div>
    <div class="card" data-message="password_details"></div>
    <div class="card" data-message="serverUrl_details"></div>
    <div class="card" data-message="storageFolder_details"></div>
    <div class="card" data-message="useDLPassword_details"></div>
    <div class="card" data-message="useGeneratedDlPassword_details"></div>
    <div class="card" data-message="useNoDlPassword_details"></div>
    <div class="card" data-message="username_details"></div>
    <div id="no_uploads" data-message="status_no_uploads"></div>
    <div id="obsolete_string" hidden data-message="obsolete_version"></div>
    <label data-message="expiryDaysAfter"></label>
    <label data-message="useDlPassword"></label>
    <label for="noAutoDownload" data-message="noAutoDownload"></label>
    <label for="oneDLPassword" data-message="oneDLPassword"></label>
    <label for="password" data-message="password"></label>
    <label for="serverUrl" data-message="serverUrl"></label>
    <label for="storageFolder" data-message="storageFolder"></label>
    <label for="useExpiry" data-message="expiryDaysBefore"></label>
    <label for="useGeneratedDlPassword" data-message="useGeneratedDlPassword"></label>
    <label for="useNoDlPassword" data-message="useNoDlPassword"></label>
    <label for="username" data-message="username"></label>
    <summary data-message="advanced_options"></summary>
    `;
}