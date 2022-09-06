import { CloudAPI } from "../../src/common/cloudapi.js";
const expect = chai.expect;

describe("CloudAPI", () => {
    beforeEach(() => {
        sinon.stub(CloudAPI, "doApiCall");
    });
    afterEach(sinon.restore);

    describe('doApiCall', () => {
        beforeEach(() => {
            CloudAPI.doApiCall.restore();
            sinon.stub(window, "fetch");
        });

        function make_response(body, status) {
            return new Response(
                JSON.stringify(body),
                {
                    status,
                    headers: { 'Content-type': 'application/json' }
                });
        }
        const account = {
            username: "username",
            password: "password",
            serverUrl: "https://example.com",
        };

        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("doApiCall");
        });
        it("is an async method", () => {
            expect(CloudAPI.doApiCall(account, "/")).to.be.a("Promise");
        });
        it("returns null if the json returned by fetch is malformed", async () => {
            const response = new Response("invalid json", {
                status: 200,
                headers: { 'Content-type': 'application/json' },
            });
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if fetch throws anything", async () => {
            window.fetch.throws(TypeError);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if the http status is 300 or above", async () => {
            const response = make_response({
                ocs: {
                    data: { x: 42, },
                    meta: { statuscode: 200, },
                }
            }, 300);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if func_url is not a valid url (path)", async () => {
            expect(await CloudAPI.doApiCall(account, 'http:/')).to.be.null;
        });
        it("returns null if the response does not contain an OCS status", async () => {
            const response = make_response({
                ocs: {
                    data: { x: 42, },
                    meta: {},
                }
            }, 300);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if the OCS status is 300 or above", async () => {
            const response = make_response({
                ocs: {
                    data: { x: 42, },
                    meta: { statuscode: 997, },
                }
            }, 200);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if the response does not contain an ocs property", async () => {
            const response = make_response({}, 200);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });
        it("returns null if the response doesn't contain a data property in ocs", async () => {
            const response = make_response({
                ocs: {
                    meta: { statuscode: 200, },
                }
            }, 200);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.be.null;
        });

        it("returns the content of ocs.data if everything is fine", async () => {
            const response = make_response({
                ocs: {
                    data: { x: 42, },
                    meta: { statuscode: 200, },
                },
            }, 200);
            window.fetch.resolves(response);
            expect(await CloudAPI.doApiCall(account, "/")).to.deep.equal({ x: 42, });
        });

        it("sets the OCS-APIREQUEST header to 'true'", async () => {
            await CloudAPI.doApiCall(account, "/");
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.headers["OCS-APIREQUEST"]).to.equal("true");
        });
        it("sets the User-Agent header", async () => {
            await CloudAPI.doApiCall(account, "/");
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.headers["User-Agent"]).to.match(/^Filelink for \*cloud\/\d+\.\d+\.\d+$/);
        });
        it("sets the Authorization header", async () => {
            await CloudAPI.doApiCall(account, "/");
            const a = window.fetch.lastCall.lastArg.headers.Authorization.split(/ /);
            expect(a[0]).to.equal("Basic");
            expect(atob(a[1])).to.equal("username:password");
        });
        it("adds additional headers supplied in the call", async () => {
            await CloudAPI.doApiCall(account, "/", "GET", { h1: "H1", h2: "H2", });
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.headers.h1).to.equal("H1");
            expect(fetchInfo.headers.h2).to.equal("H2");
        });
        it("sets credentials:omit in the fetch options", async () => {
            await CloudAPI.doApiCall(account, "/");
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.credentials).to.equal("omit");
        });
        it("sets the body to a supplied body", async () => {
            const body = "Elle\nMacpherson";
            await CloudAPI.doApiCall(account, "/", "GET", {}, body);
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.body).to.equal(body);
        });
        it("calls fetch with the GET method if called with no method", async () => {
            await CloudAPI.doApiCall(account, "/");
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.method).to.equal("GET");
        });
        it("calls fetch with the method from the third parameter", async () => {
            await CloudAPI.doApiCall(account, "/", "ACT!");
            const fetchInfo = window.fetch.lastCall.lastArg;
            expect(fetchInfo.method).to.equal("ACT!");
        });
        it("appends format=json to the url", async () => {
            await CloudAPI.doApiCall(account, "/");
            const u = new URL(window.fetch.lastCall.firstArg);
            expect(u.searchParams.get("format")).to.equal("json");
        });
        it("calls fetch with the complete url", async () => {
            await CloudAPI.doApiCall(account, "http://heise.de");
            expect(window.fetch.lastCall.firstArg.href).to.equal("http://heise.de/?format=json");
        });
        it("adds the account's server url to the url it that is a bare path", async () => {
            await CloudAPI.doApiCall(account, "/");
            expect(window.fetch.lastCall.firstArg.href).to.equal("https://example.com/?format=json");
        });
    });

    describe('getAppPassword', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getAppPassword");
        });
        it("is an async method", () => {
            expect(CloudAPI.getAppPassword({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getAppPassword({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getAppPassword({});
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("ocs/v1.php/core/getapppassword");
        });
        it("returns null it the API call doesn't return a password", async () => {
            CloudAPI.doApiCall.resolves({});
            expect(await CloudAPI.getAppPassword({})).to.be.null;
        });
        it("returns the password from the API call", async () => {
            CloudAPI.doApiCall.resolves({ apppassword: "apppassword", });
            expect(await CloudAPI.getAppPassword({})).to.equal("apppassword");
        });
    });

    describe('getCapabilitiesAndVersion', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getCapabilitiesAndVersion");
        });
        it("is an async method", () => {
            expect(CloudAPI.getCapabilitiesAndVersion({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getCapabilitiesAndVersion({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getCapabilitiesAndVersion({});
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("ocs/v1.php/cloud/capabilities");
        });
        it("returns an object with properties 'capabilities' and 'version' if the API call does", async () => {
            const r = { capabilities: { x: 42, }, version: { y: 15, } };
            CloudAPI.doApiCall.resolves(r);
            expect(await CloudAPI.getCapabilitiesAndVersion({})).to.deep.equal(r);
        });
        it("returns capabilities: null if the API call does not return capabilities", async () => {
            const r = { version: { y: 15, } };
            CloudAPI.doApiCall.resolves(r);
            expect(await CloudAPI.getCapabilitiesAndVersion({})).to.have.property("capabilities", null);
        });
        it("returns version: null if the API does not return version", async () => {
            const r = { capabilities: { y: 15, } };
            CloudAPI.doApiCall.resolves(r);
            expect(await CloudAPI.getCapabilitiesAndVersion({})).to.have.property("version", null);
        });
    });

    describe('getGeneratedPassword', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getGeneratedPassword");
        });
        it("is an async method", () => {
            expect(CloudAPI.getGeneratedPassword({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getGeneratedPassword({ password_generate_url: "yeah", })).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getGeneratedPassword({ password_generate_url: "yeah", });
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("yeah");
        });
        it("returns null if the account does not have a password generation url", async () => {
            await CloudAPI.getGeneratedPassword({ password_generate_url: "yeah", });
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("yeah");
        });
        it("returns the generated password if API call returns one", async () => {
            CloudAPI.doApiCall.resolves({ password: "password", });
            expect(await CloudAPI.getGeneratedPassword({ password_generate_url: "yeah", })).to.equal("password");
        });
        it("returns null if it doesn't", async () => {
            CloudAPI.doApiCall.resolves({});
            expect(await CloudAPI.getGeneratedPassword({ password_generate_url: "yeah", })).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
    });

    describe('getNewShare', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getNewShare");
        });
        it("is an async method", () => {
            expect(CloudAPI.getNewShare({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getNewShare({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getNewShare({ useExpiry: true, }, "path", "date");
            expect(CloudAPI.doApiCall.lastCall.args).to.deep.equal([
                { useExpiry: true, },
                "ocs/v1.php/apps/files_sharing/api/v1/shares",
                "POST",
                { "Content-Type": "application/x-www-form-urlencoded" },
                "path=path&shareType=3&expireDate=date",
            ]);
        });
        it("returns the url if the API response contains one", async () => {
            CloudAPI.doApiCall.resolves({ url: "url", });
            expect(await CloudAPI.getNewShare({ useExpiry: true, }, "path", "date")).to.equal("url");
        });
        it(" returns null if it doesn't", async () => {
            CloudAPI.doApiCall.resolves({});
            expect(await CloudAPI.getNewShare({ useExpiry: true, }, "path", "date")).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
    });

    describe('getQuota', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getQuota");
        });
        it("is an async method", () => {
            expect(CloudAPI.getQuota({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getQuota({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getQuota({ userId: "userId", });
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("ocs/v1.php/cloud/users/userId");
        });
        it("returns null if the API response doesn't contain a quota property", async () => {
            CloudAPI.doApiCall.resolves({});
            expect(await CloudAPI.getQuota({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("returns free as a number if the API answer contains one", async () => {
            CloudAPI.doApiCall.resolves({ quota: { free: 42, }, });
            expect(await CloudAPI.getQuota({})).to.have.property("free", 42);
        });
        it("returns free: null if the API answerd does not contain a value", async () => {
            CloudAPI.doApiCall.resolves({ quota: {}, });
            expect(await CloudAPI.getQuota({})).to.have.property("free", null);
        });
        it("returns free: null if the API answer contains an invalid value", async () => {
            CloudAPI.doApiCall.resolves({ quota: { free: "not a number" }, });
            expect(await CloudAPI.getQuota({})).to.have.property("free", null);
        });
        it("returns used as a number if the API answer contains one", async () => {
            CloudAPI.doApiCall.resolves({ quota: { used: 42, }, });
            expect(await CloudAPI.getQuota({})).to.have.property("used", 42);
        });
        it("returns used: null if the API answerd does not contain a value", async () => {
            CloudAPI.doApiCall.resolves({ quota: {}, });
            expect(await CloudAPI.getQuota({})).to.have.property("used", null);
        });
        it("returns used: null if the API answer contains an invalid value", async () => {
            CloudAPI.doApiCall.resolves({ quota: { used: "not a number" }, });
            expect(await CloudAPI.getQuota({})).to.have.property("used", null);
        });
        it("returns total as a number if the API answer contains one", async () => {
            CloudAPI.doApiCall.resolves({ quota: { total: 42, }, });
            expect(await CloudAPI.getQuota({})).to.have.property("total", 42);
        });
        it("returns total: null if the API answerd does not contain a value", async () => {
            CloudAPI.doApiCall.resolves({ quota: {}, });
            expect(await CloudAPI.getQuota({})).to.have.property("total", null);
        });
        it("returns total: null if the API answer contains an invalid value", async () => {
            CloudAPI.doApiCall.resolves({ quota: { total: "not a number" }, });
            expect(await CloudAPI.getQuota({})).to.have.property("total", null);
        });
    });

    describe('getSharesForFile', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getSharesForFile");
        });
        it("is an async method", () => {
            expect(CloudAPI.getSharesForFile({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getSharesForFile({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getSharesForFile({}, "path");
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("ocs/v1.php/apps/files_sharing/api/v1/shares?path=path");
        });
        it("returns null if the API call doesn't return existing shares", async () => {
            CloudAPI.doApiCall.resolves(7);
            expect(await CloudAPI.getSharesForFile({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("returns an array of shares if the API call does", async () => {
            const a = [1, 2, 3,];
            CloudAPI.doApiCall.resolves(a);
            expect(await CloudAPI.getSharesForFile({})).to.deep.equal(a);
        });
    });

    describe('getUserId', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("getUserId");
        });
        it("is an async method", () => {
            expect(CloudAPI.getUserId({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.getUserId({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.getUserId({});
            expect(CloudAPI.doApiCall.lastCall.lastArg).to.equal("ocs/v1.php/cloud/user");
        });
        it("returns null if the API response does not contain an userId", async () => {
            CloudAPI.doApiCall.resolves({});
            expect(await CloudAPI.getUserId({})).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("returns the userid if the API response contains one", async () => {
            CloudAPI.doApiCall.resolves({ id: "userId", });
            expect(await CloudAPI.getUserId({})).to.equal("userId");
        });
    });

    describe('validateDownloadPassword', () => {
        it("is a static method", () => {
            expect(CloudAPI).itself.to.respondTo("validateDownloadPassword");
        });
        it("is an async method", () => {
            expect(CloudAPI.validateDownloadPassword({})).to.be.a("Promise");
        });
        it("returns null if the API call fails", async () => {
            CloudAPI.doApiCall.resolves(null);
            expect(await CloudAPI.validateDownloadPassword({ password_validate_url: "about:blank", })).to.be.null;
            expect(CloudAPI.doApiCall.calledOnce).to.be.true;
        });
        it("calls doApiCall with the right parameters", async () => {
            await CloudAPI.validateDownloadPassword({ password_validate_url: "about:blank", }, "password");
            expect(CloudAPI.doApiCall.lastCall.args).to.deep.equal([
                { password_validate_url: "about:blank", },
                "about:blank",
                "POST",
                { "Content-Type": "application/x-www-form-urlencoded" },
                "password=password",
            ]);
        });
        it("returns null if the account does not have a password_validate_url", async () => {
            expect(await CloudAPI.validateDownloadPassword({})).to.be.null;
            expect(CloudAPI.doApiCall.called).to.be.false;
        });
        it("returns true if 'passed' in the API call result is truthy", async () => {
            CloudAPI.doApiCall.resolves({ passed: 1, });
            expect(await CloudAPI.validateDownloadPassword({ password_validate_url: "about:blank", })).to.be.true;
        });
        it("returns false if 'passed' in the API call result is falsy", async () => {
            CloudAPI.doApiCall.resolves({ passed: "", });
            expect(await CloudAPI.validateDownloadPassword({ password_validate_url: "about:blank", })).to.be.false;
        });
        it("sets account.errmsg to result.reason if that is present and 'passed' in the API call result is falsy", async () => {
            CloudAPI.doApiCall.resolves({ passed: false, reason: "no", });
            const account = { password_validate_url: "about:blank", };
            await CloudAPI.validateDownloadPassword(account);
            expect(account.errmsg).to.equal("no");
        });
        it("does no set account.errmsg to result.reason if that is present and 'passed' in the API call result is truthy", async () => {
            CloudAPI.doApiCall.resolves({ passed: true, reason: "no", });
            const account = { password_validate_url: "about:blank", };
            await CloudAPI.validateDownloadPassword(account);
            expect(account.errmsg).to.be.undefined;
        });
    });
});
