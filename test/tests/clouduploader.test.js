// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CloudUploader } from "../../src/background/clouduploader.js";
import { DavUploader } from "../../src/background/davuploader.js";
import { PasswordGenerator } from "../../src/background/passwordgenerator.js";
import { Status } from "../../src/background/status.js";
import { CloudAPI } from "../../src/common/cloudapi.js";
import { Statuses } from "../../src/common/statuses.js";
import { Utils } from "../../src/common/utils.js";
const expect = chai.expect;

describe("CloudUploader", () => {
    describe('uploadFile', () => {
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(Status, "add");
            sinon.stub(Status, "set_status");
            sinon.stub(Status, "done");
            sinon.stub(Status, "fail");
            sinon.stub(CloudUploader.prototype, "updateFreeSpaceInfo");
            sinon.stub(CloudUploader.prototype, "getShareLink").resolves("https://example.com");
            sinon.stub(CloudUploader.prototype, "cleanUrl").returnsArg(0);
            sinon.stub(DavUploader.prototype, "uploadFile").resolves({ ok: true, });
        });

        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("uploadFile");
        });
        it("is an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.uploadFile()).to.be.a("Promise");
        });
        it("adds a new item to Status", async () => {
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(Status.add.calledOnce).to.be.true;
            expect(Status.add.lastCall.firstArg).to.equal("uploadId");
        });
        it("sets that status", async () => {
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(Status.set_status.calledTwice).to.be.true;
            expect(Status.set_status.firstCall.firstArg).to.equal("uploadId");
            expect(Status.set_status.firstCall.lastArg).to.equal("preparing");
            expect(Status.set_status.lastCall.firstArg).to.equal("uploadId");
            expect(Status.set_status.lastCall.lastArg).to.equal("sharing");
        });
        it("uses a DavUploader to upload the file", async () => {
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(DavUploader.prototype.uploadFile.calledOnce).to.be.true;
            expect(DavUploader.prototype.uploadFile.lastCall.args).to.deep.equal([
                "uploadId",
                "fileName",
                {},
            ]);
        });
        it("sets aborted to true in the return object if the upload was aborted", async () => {
            DavUploader.prototype.uploadFile.resolves({ aborted: true, });
            const cu = new CloudUploader("id");
            expect(await cu.uploadFile("uploadId", "fileName", {})).to.have.property("aborted", true);
        });
        it.skip("calls Status.fail if the upload fails", async () => {
            CloudUploader.prototype.cleanUrl.returns(null);
            const cu = new CloudUploader("id");
            try {
                await cu.uploadFile("uploadId", "fileName", {});
            } catch (_) { }
            expect(Status.fail.calledOnce).to.be.true;
        });
        it.skip("throws an Error with message 'Upload failed.' if the upload fails", () => {
            /** @todo fix the test */
            DavUploader.prototype.uploadFile.resolves({ ok: false, });
            const cu = new CloudUploader("id");
            expect(() => cu.uploadFile("uploadId", "fileName", {})).to.throw();
        });
        it("calls getShareLink and cleanUrl on the url", async () => {
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(CloudUploader.prototype.getShareLink.calledOnce).to.be.true;
            expect(CloudUploader.prototype.getShareLink.lastCall.args).to.deep.equal(["fileName", "uploadId"]);
            expect(CloudUploader.prototype.cleanUrl.calledOnce).to.be.true;
            expect(CloudUploader.prototype.cleanUrl.lastCall.firstArg).to.equal("https://example.com");
        });
        it("calls Status.done if the url is OK", async () => {
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(Status.done.calledOnce).to.be.true;
        });
        it("sets the url and aborted:false in the return object if the url is OK", async () => {
            const cu = new CloudUploader("id");
            expect(await cu.uploadFile("uploadId", "fileName", {})).to.deep.equal({
                url: "https://example.com",
                aborted: false,
            });
        });
        it.skip("calls Status.fail if the url is not OK", async () => {
            CloudUploader.prototype.cleanUrl.returns(null);
            const cu = new CloudUploader("id");
            await cu.uploadFile("uploadId", "fileName", {});
            expect(Status.fail.calledOnce).to.be.true;
        });
        it.skip("throws an Error with message 'Upload failed.' if the url is not OK", async () => {
            /** @todo fix the test */
            CloudUploader.prototype.cleanUrl.returns(null);
            const cu = new CloudUploader("id");
            expect(() => cu.uploadFile("uploadId", "fileName", {})).to.throw(Error, "Upload failed.");
        });
    });
    describe('generateDownloadPassword', () => {
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(CloudAPI, "getGeneratedPassword");
            sinon.stub(PasswordGenerator, "generate");
        });

        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("generateDownloadPassword");
        });
        it("is an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.generateDownloadPassword()).to.be.a("Promise");
        });
        it("gets a generated password from CloudAPI and returns that password", async () => {
            CloudAPI.getGeneratedPassword.resolves("passwort");
            const cu = new CloudUploader("id");
            expect(await cu.generateDownloadPassword()).to.equal("passwort");
            expect(CloudAPI.getGeneratedPassword.calledOnce).to.be.true;
        });
        it("uses PasswordGenerator if CloudAPI returns falsy and returns that password", async () => {
            CloudAPI.getGeneratedPassword.resolves(null);
            PasswordGenerator.generate.returns("passwort");
            const cu = new CloudUploader("id");
            expect(await cu.generateDownloadPassword()).to.equal("passwort");
            expect(PasswordGenerator.generate.calledOnce).to.be.true;
        });
    });
    describe('getShareLink', () => {
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(Utils, "encodepath").returns("path");
            sinon.stub(CloudUploader.prototype, "findExistingShare").resolves(null);
            sinon.stub(CloudUploader.prototype, "makeNewShare");
        });

        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("getShareLink");
        });
        it("is an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.getShareLink()).to.be.a("Promise");
        });
        it("encodes the path", async () => {
            const cu = new CloudUploader("id");
            await cu.getShareLink("füllNähe", "uploadId");
            expect(CloudUploader.prototype.findExistingShare.calledOnce).to.be.true;
            expect(CloudUploader.prototype.findExistingShare.lastCall.firstArg).to.equal("path");
        });
        it("Makes an ISO date by addint expiry days to the current date", async () => {
            const cu = new CloudUploader("id");
            cu.useExpiry = true;
            cu.expiryDays = 7;
            sinon.useFakeTimers();
            await cu.getShareLink("fileName", "uploadId");
            expect(CloudUploader.prototype.findExistingShare.lastCall.lastArg).to.equal("1970-01-08");

        });
        it("calls findExistingShare if no download password is required", async () => {
            const cu = new CloudUploader("id");
            await cu.getShareLink("fileName", "uploadId");
            expect(CloudUploader.prototype.findExistingShare.calledOnce).to.be.true;
        });
        it("doesn't call findExistingShare if one download password is configured", async () => {
            const cu = new CloudUploader("id");
            cu.oneDLPassword = true;
            await cu.getShareLink("fileName", "uploadId");
            expect(CloudUploader.prototype.findExistingShare.called).to.be.false;
        });
        it("doesn't call findExistingShare if generated passwords are configured", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = true;
            await cu.getShareLink("fileName", "uploadId");
            expect(CloudUploader.prototype.findExistingShare.called).to.be.false;
        });
        it("returns an existing share url", async () => {
            const cu = new CloudUploader("id");
            CloudUploader.prototype.findExistingShare.resolves("url");
            expect(await cu.getShareLink("fileName", "uploadId")).to.equal("url");
        });
        it("creates a new share link if there is no matching one", async () => {
            const cu = new CloudUploader("id");
            await cu.getShareLink("fileName", "uploadId");
            expect(CloudUploader.prototype.makeNewShare.calledOnce).to.be.true;
        });
        it("returns that share link", async () => {
            const cu = new CloudUploader("id");
            CloudUploader.prototype.makeNewShare.resolves("url");
            expect(await cu.getShareLink("fileName", "uploadId")).to.equal("url");
        });
    });
    describe('findExistingShare', () => {
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(CloudAPI, "getSharesForFile");
        });

        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("findExistingShare");
        });
        it("is an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.findExistingShare()).to.be.a("Promise");
        });
        it("gets all shares for the file", async () => {
            const cu = new CloudUploader("id");
            await cu.findExistingShare("path_to_share", "1970-01-08");
            expect(CloudAPI.getSharesForFile.calledOnce).to.be.true;
        });
        it("returns null if the API call fails", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves(null);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if there are none", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if it cannot search in the return value", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves({ x: 42, });
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if there is no public share", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([{ share_type: 1, url: "url", }, { share_type: 2, url: "url", },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if a pasword is set on every share", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([
                { share_type: 3, password: "someone", url: "url", },
                { share_type: 3, password: "Password", url: "url", },
            ]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if a share_with is set on every share", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([
                { share_type: 3, share_with: "someone", url: "url", },
                { share_type: 3, share_with: "Password", url: "url", },
            ]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if useExpiry is not set but expiry is set on the shares", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, expiration: "1970-01-08", url: "url", },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if useExpiry is set but no expiry is set on the shares", async () => {
            const cu = new CloudUploader("id");
            cu.useExpiry = true;
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, url: "url", },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if useExpiry is set but no matching expiry is set on a share", async () => {
            const cu = new CloudUploader("id");
            cu.useExpiry = true;
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, expiration: "2070-01-08", url: "url", },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.be.null;
        });
        it("returns null if useExpiry and expiry match, but a password is set", async () => {
            const cu = new CloudUploader("id");
            cu.useExpiry = true;
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, expiration: "1970-01-08", url: "url", share_with: "someone", },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08",)).to.be.null;
        });
        it("returns the url if useExpiry is not set and no expiry is set on a share", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, expiration: null, url: "url" },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.equal("url");
        });
        it("returns the url if useExpiry is set and expiry is the same on a share", async () => {
            const cu = new CloudUploader("id");
            cu.useExpiry = true;
            CloudAPI.getSharesForFile.resolves([{ share_type: 3, expiration: "1970-01-08", url: "url" },]);
            expect(await cu.findExistingShare("path_to_share", "1970-01-08")).to.equal("url");
        });
    });
    describe('makeNewShare', () => {
        afterEach(sinon.restore);
        beforeEach(() => {
            sinon.stub(CloudUploader.prototype, "generateDownloadPassword").resolves("GenPassword");
            sinon.stub(CloudAPI, "getNewShare").resolves("url");
            sinon.stub(Status, "set_password");
            sinon.stub(Status, "set_status");
        });

        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("makeNewShare");
        });
        it("is an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.makeNewShare()).to.be.a("Promise");
        });
        it("calls generateDownloadPassword if useGeneratedDlPassword is true", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = true;
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(CloudUploader.prototype.generateDownloadPassword.calledOnce).to.be.true;
        });
        it("sets the generated password status if useGeneratedDlPassword is true", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = true;
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(Status.set_status.calledOnce).to.be.true;
            expect(Status.set_status.lastCall.firstArg).to.equal("uploadId");
            expect(Status.set_status.lastCall.lastArg).to.equal(Statuses.GENERATEDPASSWORD);
        });
        it("stores the generated password in Status if useGeneratedDlPassword is true", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = true;
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(Status.set_password.calledOnce).to.be.true;
            expect(Status.set_password.lastCall.firstArg).to.equal("uploadId");
            expect(Status.set_password.lastCall.lastArg).to.equal("GenPassword");
        });
        it("doesn't call generateDownloadPassword if useGeneratedDlPassword is false", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = false;
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(CloudUploader.prototype.generateDownloadPassword.calledOnce).to.be.false;
        });
        it("doesn't set the generated password status if useGeneratedDlPassword is false", async () => {
            const cu = new CloudUploader("id");
            cu.useGeneratedDlPassword = false;
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(Status.set_status.called).to.be.false;
        });
        it("gets an url from CloudAPI", async () => {
            const cu = new CloudUploader("id");
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(CloudAPI.getNewShare.calledOnce).to.be.true;
            expect(CloudAPI.getNewShare.lastCall.args).to.deep.equal([
                cu,
                "path_to_share",
                "1970-01-08",
            ]);
        });
        it("returns the url", async () => {
            const cu = new CloudUploader("id");
            expect(await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId")).to.equal("url");
        });
        it("returns null if the CloudAPI does", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getNewShare.resolves(null);
            expect(await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId")).to.be.null;
        });
        it("doesn't set the generated password status if CloudAPI fails", async () => {
            const cu = new CloudUploader("id");
            CloudAPI.getNewShare.resolves(null);
            await cu.makeNewShare("path_to_share", "1970-01-08", "uploadId");
            expect(Status.set_status.called).to.be.false;
        });
    });
    describe('cleanUrl', () => {
        it("is not a static method", () => {
            expect(CloudUploader).not.itself.to.respondTo("uploadFile");
        });
        it("is not an async method", () => {
            const cu = new CloudUploader("id");
            expect(cu.cleanUrl("https://example.com")).not.to.be.a("Promise");
        });
        it("returns null if the url is malformed", () => {
            const cu = new CloudUploader("id");
            expect(cu.cleanUrl("*")).to.be.null;
        });
        it("returns null if the protocol is neither http nor https", () => {
            const cu = new CloudUploader("id");
            expect(cu.cleanUrl("ftp://example.com")).to.be.null;
        });
        it("replaces a punycode hostname with the Unicode string", () => {
            const cu = new CloudUploader("id");
            expect(cu.cleanUrl("http://xn--dner-5qa.de")).to.equal("http://döner.de/download");
        });
        it("encodes the pathname with Utils.encodepath", () => {
            const cu = new CloudUploader("id");
            expect(cu.cleanUrl("http://example.com/äöü")).to.equal("http://example.com/%C3%A4%C3%B6%C3%BC/download");
        });
        it("appends /download if that is configured in the account", () => {
            const cu = new CloudUploader("id");
            cu.noAutoDownload = false;
            expect(cu.cleanUrl("http://example.com")).to.equal("http://example.com/download");
        });
        it("appends /download if there is no configuration in the account", () => {
            const cu = new CloudUploader("id");
            cu.noAutoDownload = false;
            expect(cu.cleanUrl("http://example.com")).to.equal("http://example.com/download");
        });
        it("does not append /download if that not configured in the account", () => {
            const cu = new CloudUploader("id");
            cu.noAutoDownload = true;
            expect(cu.cleanUrl("http://example.com")).to.equal("http://example.com/");
        });
    });
});
