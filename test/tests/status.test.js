// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Status } from "../../src/background/status.js";
import { Statuses } from "../../src/common/statuses.js";
const expect = chai.expect;

describe("Status", () => {
    describe("add", () => {
        after(() => {
            Status.attachmentStatus.clear();
        });
        it("makes sure its attachmentStatus Map exists", () => {
            Status.add("id1", "fname");
            expect(Status.attachmentStatus).to.be.a("Map");
        });
        it("adds an UploadStatus element for the uploadId", () => {
            Status.add("id2", "fname");
            expect(Status.attachmentStatus.get("id2")).to.have.a.property("filename", "fname");
        });
    });
    describe("set_status", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("status", "status");
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("sets the status of the corresponding element to the given one", () => {
            Status.add("id", "fname");
            Status.set_status("status", "status");
            expect(Status.attachmentStatus.get("status")).to.have.a.property("status", "status");
        });
        it("calls Status.update", () => {
            Status.set_status("status", "status");
            expect(Status.update.calledOnce).to.be.true;
        });
        it("does nothing if the element does not exist", () => {
            const map_before = Status.attachmentStatus;
            Status.set_status("unknown", "status");
            expect(Status.attachmentStatus).to.deep.equal(map_before);
        });
    });
    describe("fail", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("fail", "fail");
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("sets the error property of the entry", () => {
            Status.fail("fail");
            expect(Status.attachmentStatus.get("fail").error).to.be.true;
        });
        it("calls Status.update", () => {
            Status.fail("fail");
            expect(Status.update.calledOnce).to.be.true;
        });
        it("does nothing if the element does not exist", () => {
            const map_before = Status.attachmentStatus;
            Status.fail("unknown");
            expect(Status.attachmentStatus).to.deep.equal(map_before);
        });
    });
    describe("set_progress", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("progress", "progress");
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("sets the progress of the corresponding element to the given value", () => {
            Status.set_progress("progress", 42);
            expect(Status.attachmentStatus.get("progress").progress).to.equal(42);
        });
        it("calls Status.update", () => {
            Status.set_progress("progress", 42);
            expect(Status.update.calledOnce).to.be.true;
        });
        it("does nothing if the element does not exist", () => {
            const map_before = Status.attachmentStatus;
            Status.set_progress("unknown", 42);
            expect(Status.attachmentStatus).to.deep.equal(map_before);
        });
    });
    describe("set_password", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("password", "password");
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("sets the password of the corresponding element to the given value", () => {
            Status.set_password("password", "Password+1");
            expect(Status.attachmentStatus.get("password").password).to.equal("Password+1");
        });
        it("calls Status.update", () => {
            Status.set_password("password", "42");
            expect(Status.update.calledOnce).to.be.true;
        });
        it("does nothing if the element does not exist", () => {
            const map_before = Status.attachmentStatus;
            Status.set_password("unknown", "42");
            expect(Status.attachmentStatus).to.deep.equal(map_before);
        });
    });
    describe("done", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("error", "error");
            Status.fail("error");
            Status.add("password", "password");
            Status.set_password("password", "password");
            Status.set_status("password", Statuses.GENERATEDPASSWORD);
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        for (const key in Statuses) {
            if (key === "GENERATEDPASSWORD") continue;
            it("removes an element in status " + key, () => {
                Status.add("OK", key);
                Status.set_status("OK", Statuses[key]);
                Status.done("OK");
                expect(Status.attachmentStatus.has("OK")).to.be.false;
            });
        }

        it("does not remove the element, if it's in error state", () => {
            Status.done("error");
            expect(Status.attachmentStatus.has("error")).to.be.true;
        });
        it("does not remove the element, if it's in state GENERATEDPASSWORD", () => {
            Status.done("password");
            expect(Status.attachmentStatus.has("password")).to.be.true;
        });
        it("does nothing if the element does not exist", () => {
            const map_before = new Map(Status.attachmentStatus);
            Status.done("unknown");
            expect(Status.attachmentStatus).to.deep.equal(map_before);
        });
        it("calls Status.update", () => {
            Status.add("OK", "OK");
            Status.done("OK");
            expect(Status.update.called).to.be.true;
        });
    });
    describe("update", () => { /* async */
        beforeEach(() => {
            Status.port = { postMessage: sinon.fake(), };
            browser.composeAction = { setBadgeText: sinon.fake() };
        });
        afterEach(sinon.restore);

        it("sets the action badge to null if the attachmentStatus is empty", async () => {
            Status.attachmentStatus.clear();
            await Status.update();
            expect(browser.composeAction.setBadgeText.lastCall.firstArg).to.deep.equal({ text: null, });
        });
        it("set the action badge to the number of elements in attachmentStatus as a string", async () => {
            Status.add("one", "one");
            await Status.update();
            expect(browser.composeAction.setBadgeText.lastCall.firstArg).to.deep.equal({ text: "1", });
        });
        it("posts attachmentStatus as a message if the port exists", async () => {
            await Status.update();
            expect(Status.port.postMessage.calledOnce).to.be.true;
            expect(Status.port.postMessage.lastCall.firstArg).to.equal(Status.attachmentStatus);
        });
    });
    describe("remove", () => { /* async */
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("remove", "remove");
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("deletes the element from attachmentStatus", () => {
            Status.remove("remove");
            expect(Status.attachmentStatus.has("remove")).to.be.false;
        });
        it("calls Status.update", () => {
            Status.remove("remove");
            expect(Status.update.calledOnce).to.be.true;
        });
    });
    describe("clearcomplete", () => {
        beforeEach(() => {
            sinon.stub(Status, "update");
            Status.add("error", "error");
            Status.fail("error");
            Status.add("password", "password");
            Status.set_password("password", "password");
            Status.set_status("password", Statuses.GENERATEDPASSWORD);
        });
        afterEach(() => {
            sinon.restore();
            Status.attachmentStatus.clear();
        });
        it("removes all elements in status error", () => {
            Status.clearcomplete();
            expect(Status.attachmentStatus.has("error")).to.be.false;
        });
        it("removes all elements in status GENERATEDPASSWORD", () => {
            Status.clearcomplete();
            expect(Status.attachmentStatus.has("password")).to.be.false;
        });
        for (const key in Statuses) {
            if (key === "GENERATEDPASSWORD") continue;
            it("does not remove element in status " + key, () => {
                Status.add("OK", key);
                Status.set_status("OK", Statuses[key]);
                Status.clearcomplete();
                expect(Status.attachmentStatus.has("OK")).to.be.true;
            });
        }
        it("calls Status.update", () => {
            Status.clearcomplete();
            expect(Status.update.called).to.be.true;
        });
    });
});