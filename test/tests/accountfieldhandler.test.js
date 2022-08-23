import { AccountFieldHandler } from "../../src/management/accountfieldhandler.js";
import { Popup } from "../../src/management/popup/popup.js";

const expect = chai.expect;

describe("AccountFieldHandler", () => {
    describe('preCloudUpdate', () => {
        const serverUrl = { value: "https://example.com", };
        const password = { value: "password", };

        beforeEach(() => {
            sinon.stub(Popup, "warn");
            sinon.stub(document, "querySelector").
                withArgs("#serverUrl").returns(serverUrl).
                withArgs("#password").returns(password);
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(AccountFieldHandler).itself.to.respondTo("preCloudUpdate");
        });

        it("throws an exception if the server url is malformed", () => {
            serverUrl.value = "not an url";
            expect(AccountFieldHandler.preCloudUpdate).to.throw();
        });
        it("replaces consecutive slashes in the url path with one", () => {
            serverUrl.value = "https://example.com/path///to///";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes all url parameters from the server url", () => {
            serverUrl.value = "https://example.com/path/to/?x=y&z=42";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes '/apps/files' from the end of the server url", () => {
            serverUrl.value = "https://example.com/path/to/apps/files/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes '/apps/dashboard' from the end of the server url", () => {
            serverUrl.value = "https://example.com/path/to/apps/dashboard/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes 'index.php' from the end of the url", () => {
            serverUrl.value = "https://example.com/path/to/index.php";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes 'index.php' before '/apps/dashboard'", () => {
            serverUrl.value = "https://example.com/path/to/index.php/apps/dashboard/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes 'index.php/apps/' and anything that follows it from the url", () => {
            serverUrl.value = "https://example.com/path/to/index.php/apps/some/more/stuff/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes a hash from the server url", () => {
            serverUrl.value = "https://example.com/path/to/#12345";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes a user name from the url", () => {
            serverUrl.value = "https://user@example.com/path/to/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("removes a password from the url", () => {
            serverUrl.value = "https://user:password@example.com/path/to/apps/dashboard/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("keeps a port in the url", () => {
            serverUrl.value = "https://example.com:666/path/to/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com:666/path/to/", });
        });
        it("warns if the server url is not https", () => {
            serverUrl.value = "http://example.com";
            AccountFieldHandler.preCloudUpdate();
            expect(Popup.warn.calledOnce).to.be.true;
            expect(Popup.warn.lastCall.firstArg).to.equal("insecure_http");
        });
        it("adds a / to the end of the server url if it's missing", () => {
            serverUrl.value = "https://example.com/path/to";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });
        it("does not add a / to the server url if there is one", () => {
            serverUrl.value = "https://example.com/path/to/";
            AccountFieldHandler.preCloudUpdate();
            expect(serverUrl).to.deep.equal({ value: "https://example.com/path/to/", });
        });

        it("warns if the password contains ö", () => {
            password.value = "Gekröse";
            AccountFieldHandler.preCloudUpdate();
            expect(Popup.warn.calledOnce).to.be.true;
            expect(Popup.warn.lastCall.firstArg).to.equal("nonascii_password");
        });
    });

    describe('postCloudUpdate', () => {
        it("is a static method", () => {
            expect(AccountFieldHandler).itself.to.respondTo("postCloudUpdate");
        });
        it("calls convertToApppassword", async () => {
            const cloudaccount = { convertToApppassword: sinon.fake(), };
            await AccountFieldHandler.postCloudUpdate(cloudaccount);
            expect(cloudaccount.convertToApppassword.calledOnce).to.be.true;
        });
    });
});
