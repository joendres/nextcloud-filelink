import { TBVersionWorkarounds } from "../../src/background/tbversionworkarounds.js";
import { Localize } from "../../src/common/localize.js";
const expect = chai.expect;

describe.only("TBVersionWorkarounds", () => {
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

        before(() => {
            browser.composeAction = {
                setTitle: sinon.fake(),
            };
            sinon.stub(Localize, "localizeMSGString").returns("label");
        });

        it("does nothing in current versions", () => {
            browser.composeAction.setLabel = () => { };
            expect(browser.composeAction.setTitle.called).to.be.false;
        });

        it.skip("does nothing if there is no default_label", () => {
            /** @todo implement test */
        });

        it.skip("sets the title to default_label in old versions", () => {
            /** @todo implement test */
        });
    });
});