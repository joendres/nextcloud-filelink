import { CurrentUploads } from "../../src/background/currentuploads.js";
const expect = chai.expect;

describe.only('CurrentUploads', () => {
    describe('set', () => {
        it("is a static method");
        it("is not an async method");
        it("creates the map property if it doesn't exist");
        it("doesn't change the map property if it already exists");
        it("adds the key value pair to the Map");
    });
    describe('get', () => {
        it("is a static method");
        it("is not an async method");
        it("returns the value if the key exists");
        it("returns undefined if the key doesn't exist");
    });
    describe('delete', () => {
        it("is a static method");
        it("is not an async method");
        it("deletes the element from the map if it exists");
        it("does not change the map if the element does not exist");
    });
    describe('abort', () => {
        it("is a static method");
        it("is not an async method");
        it("calls abort on an existing abort controller");
        it("doesn't do anything if the key doesn't point to an abortcontroller");
    });
});