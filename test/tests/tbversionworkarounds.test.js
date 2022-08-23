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
        let save_getManifest= browser.runtime.getManifest;

        before(() => {
            browser.composeAction = {
                setTitle: sinon.fake(),
            };
            sinon.stub(Localize, "localizeMSGString").returns("label");
        });

        after(() => {
            sinon.restore();
            browser.runtime.getManifest = save_getManifest;
        });

        it("does nothing in current versions", () => {
            browser.composeAction.setLabel = () => { };
            expect(browser.composeAction.setTitle.called).to.be.false;
        });

        it("does nothing if there is no default_label", () => {
            delete browser.composeAction.setLabel;

            /** @todo implement test */
            expect.fail("test not implemented");
        });

        it("sets the title to default_label in old versions", () => {
            /** @todo implement test */
            expect.fail("test not implemented");
        });
    });
});