const expect = chai.expect;

describe.only("progress.js", () => {
    before(async () => {
        const button_clear = document.createElement("button");
        sinon.stub(document, "querySelector").
            withArgs("#button_clear").
            returns(button_clear);

        sinon.stub(browser.runtime, "connect").
            returns({
                onMessage: { addListener: sinon.fake(), },
                postMessage: sinon.fake(),
            });

        await import("../../src/compose_action/progress.js");
    });
    after(sinon.restore);
    it("sets up port");
    it("installs the update handler");
    it("sends the 'update' message");
    it("localizes all labels");
    it("adds the handler to the clear button");
    /** @todo Add tests */
});
