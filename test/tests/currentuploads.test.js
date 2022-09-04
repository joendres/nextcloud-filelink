import { CurrentUploads } from "../../src/background/currentuploads.js";
const expect = chai.expect;

describe('CurrentUploads', () => {
    describe('add', () => {
        it("is a static method", () => {
            expect(CurrentUploads).itself.to.respondTo("add");
        });
        it("is not an async method", () => {
            expect(CurrentUploads.add("key", "value")).not.to.be.a("Promise");
        });
        it("adds the key value pair to the Map", () => {
            CurrentUploads.add("key", "value");
            expect(CurrentUploads.get("key")).to.equal("value");
        });
    });
    describe('get', () => {
        it("is a static method", () => {
            expect(CurrentUploads).itself.to.respondTo("get");
        });
        it("is not an async method", () => {
            expect(CurrentUploads.get("key")).not.to.be.a("Promise");
        });
        it("returns the value if the key exists", () => {
            CurrentUploads.add("key", "value");
            expect(CurrentUploads.get("key")).to.equal("value");
        });
        it("returns undefined if the key doesn't exist", () => {
            CurrentUploads.add("key", "value");
            expect(CurrentUploads.get("anything")).to.be.undefined;
        });
        it("returns undefined if the map is missing", () => {
            expect(CurrentUploads.get("anything")).to.be.undefined;
        });
    });
    describe('remove', () => {
        it("is a static method", () => {
            expect(CurrentUploads).itself.to.respondTo("remove");
        });
        it("is not an async method", () => {
            expect(CurrentUploads.remove("key")).not.to.be.a("Promise");
        });
        it("deletes the element from the map if it exists", () => {
            CurrentUploads.add("key", "value");
            CurrentUploads.remove("key");
            expect(CurrentUploads.get("key")).to.be.undefined;
        });
        it("does not change the map if the element does not exist", () => {
            CurrentUploads.add("key", "value");
            CurrentUploads.remove("missing");
            expect(CurrentUploads.get("key")).to.equal("value");
        });
    });
    describe('abort', () => {
        it("is a static method", () => {
            expect(CurrentUploads).itself.to.respondTo("abort");
        });
        it("is not an async method", () => {
            expect(CurrentUploads.abort("key")).not.to.be.a("Promise");
        });
        it("calls abort on an existing abort controller", () => {
            CurrentUploads.add("key", { abort: sinon.fake() });
            CurrentUploads.abort("key");
            const upload = CurrentUploads.get("key");
            expect(upload.abort.calledOnce).to.be.true;
        });
        it("doesn't throw if the key doesn't exist", () => {
            expect(() => CurrentUploads.abort("key")).not.to.throw();
        });
    });
});