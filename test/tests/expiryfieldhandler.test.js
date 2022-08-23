import { ExpiryFieldHandler } from "../../src/management/expiryfieldhandler.js";
const expect = chai.expect;

describe("ExpiryFieldHandler", () => {
    var useExpiry, expiryDays;

    beforeEach(() => {
        useExpiry = document.createElement("input");
        expiryDays = document.createElement("input");
        sinon.stub(document, "querySelector").
            withArgs("#useExpiry").returns(useExpiry).
            withArgs("#expiryDays").returns(expiryDays);
    });

    afterEach(() => {
        sinon.restore();
        useExpiry.remove();
        expiryDays.remove;
    });

    describe('addListeners', () => {
        it("sets the oninput handler", () => {
            ExpiryFieldHandler.addListeners();
            expect(useExpiry.oninput).to.equal(ExpiryFieldHandler.syncInputStateToCheck);
        });
    });

    describe('syncInputStateToCheck', () => {
        it("disables expiryDay if useExpiry is not checked", () => {
            useExpiry.checked = false;
            ExpiryFieldHandler.syncInputStateToCheck();
            expect(expiryDays.disabled).to.be.true;
        });
        it("doesn't require expiryDay if useExpiry is not checked", () => {
            useExpiry.checked = false;
            ExpiryFieldHandler.syncInputStateToCheck();
            expect(expiryDays.required).to.be.false;
        });
        it("enables expiryDay if useExpiry is checked", () => {
            useExpiry.checked = true;
            ExpiryFieldHandler.syncInputStateToCheck();
            expect(expiryDays.disabled).to.be.false;
        });
        it("requires expiryDay if useExpiry is checked", () => {
            useExpiry.checked = true;
            ExpiryFieldHandler.syncInputStateToCheck();
            expect(expiryDays.disabled).to.be.false;
        });
    });

    describe('fillData', () => {
        it("removes the max attribute of expiryDays if no maximum is in the account", () => {
            const account = {};
            ExpiryFieldHandler.fillData(account);
            expect(expiryDays.hasAttribute("max")).to.be.false;
        });
        it("enables useExpiry if no maximum is in the account", () => {
            const account = {};
            ExpiryFieldHandler.fillData(account);
            expect(useExpiry.disabled).to.be.false;
        });

        it("sets expiryDays to account.expiryDays if no maximum", () => {
            const account = { expiryDays: 42, };
            ExpiryFieldHandler.fillData(account);
            expect(expiryDays.value).to.equal(42);
        });
        it("checks useExpiry if it is set in account", () => {
            const account = { useExpiry: true, };
            ExpiryFieldHandler.fillData(account);
            expect(useExpiry.checked).to.be.true;
        });

        it("adds a max attribute to expiryDays if a maximum is in the account", () => {
            const account = { expiry_max_days: 42, };
            ExpiryFieldHandler.fillData(account);
            expect(expiryDays.hasAttribute("max")).to.be.true;
        });
        it("sets expiryDays to account.expiryDays if that is less than the maximum in the account", () => {
            const account = { expiry_max_days: 42, expiryDays: 15, };
            ExpiryFieldHandler.fillData(account);
            expect(account.expiryDays).to.be.equal(15);
        });
        it("sets expiryDays to the maximum in the account if that is less than account.expiryDays", () => {
            const account = { expiry_max_days: 15, expiryDays: 42, };
            ExpiryFieldHandler.fillData(account);
            expect(account.expiryDays).to.be.equal(15);
        });

        /** @todo check if enforce_expiry is redundant with max_expiry */
        it("checks useExpiry if expiry is enforced");
        it("disables useExpiry if expiry is enforced");

        it("calls syncInputStateToCheck", () => {
            sinon.stub(ExpiryFieldHandler, "syncInputStateToCheck");
            const account = {};
            ExpiryFieldHandler.fillData(account);
            expect(ExpiryFieldHandler.syncInputStateToCheck.calledOnce).to.be.true;
        });
    });
});