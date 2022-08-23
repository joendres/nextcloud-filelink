import { TBVersionWorkarounds } from "../../src/background/tbversionworkarounds.js";
import { Localize } from "../../src/common/localize.js";
const expect = chai.expect;

describe("TBVersionWorkarounds", () => {
    describe("apply_all", () => {
        afterEach(sinon.restore);

        it("calls workaroundRedefinedManifestKeys", () => {
            sinon.stub(TBVersionWorkarounds, "workaroundRedefinedManifestKeys");

            TBVersionWorkarounds.apply_all();

            expect(TBVersionWorkarounds.workaroundRedefinedManifestKeys.called).to.be.true;
        });
    });

    describe("workaroundRedefinedManifestKeys", () => {
        afterEach(sinon.restore);

        beforeEach(() => {
            browser.composeAction = {
                setTitle: sinon.fake(),
            };
            sinon.stub(Localize, "localizeMSGString").returns("label");
        });

        it("does nothing in current versions (setLabel is present)", () => {
            browser.composeAction.setLabel = () => { };
            TBVersionWorkarounds.workaroundRedefinedManifestKeys();
            expect(browser.composeAction.setTitle.called).to.be.false;
            delete browser.composeAction.setLabel;
        });

        it("does nothing ig no compose_label is present", () => {
            browser.runtime.getManifest = sinon.fake.returns({});
            TBVersionWorkarounds.workaroundRedefinedManifestKeys();
            expect(browser.composeAction.setTitle.called).to.be.false;
        });

        it("does nothing if there is no default_label", () => {
            browser.runtime.getManifest = sinon.fake.returns({ compose_action: {} });
            TBVersionWorkarounds.workaroundRedefinedManifestKeys();
            expect(browser.composeAction.setTitle.called).to.be.false;
        });

        it("sets the title to default_label in old versions", () => {
            browser.runtime.getManifest = sinon.fake.returns({ compose_action: { default_label: "present" } });
            TBVersionWorkarounds.workaroundRedefinedManifestKeys();
            expect(Localize.localizeMSGString.called).to.be.true;
            expect(browser.composeAction.setTitle.called).to.be.true;
            expect(browser.composeAction.setTitle.lastCall.firstArg).to.deep.equal({ title: "default_label" });

        });
    });
});