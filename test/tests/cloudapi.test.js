import { CloudAPI } from "../../src/common/cloudapi.js";
const expect = chai.expect;

describe("CloudAPI", () => {
    /** @todo Add tests */
    describe('doApiCall', () => { });
    describe('getAppPassword', () => {
        beforeEach(() => {
            sinon.stub(CloudAPI, "doApiCall");
        });
        afterEach(sinon.restore);
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
        it("returns null it the API call doesn't return a password");
        it("returns the password from the API call");
    });
    describe('getCapabilitiesAndVersion', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('getGeneratedPassword', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('getNewShare', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('getQuota', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('getSharesForFile', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('getUserId', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
    describe('validateDownloadPassword', () => {
        it("is a static method");
        it("is an async function");
        it("returns null if the API call fails");
    });
});
