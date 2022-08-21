import { MessageDispatcher } from "../../src/background/messagedispatcher.js";
const expect = chai.expect;

describe("MessageDispatcher", () => {
    describe('installHandler', () => {
        it("installs the handler");
        it("doesn't install the handler if its already installed");
    });

    describe('connectHandler', () => {
        it("stores the port in the Status class");
        it("installs a disconnect handler");
        it("installs the dispatcher as handler");
    });

    describe('dispatch', () => {
        it("dispatches the update command");
        it("dispatches the clear_complete command");
        it("throws a ReferenceError on another command");
    });
});
