import { AccountUpdater } from "../../src/background/accountupdater.js";
const expect = chai.expect;

describe.only("AccountUpdater", () => {
    describe('update_all', () => {
        afterEach(sinon.restore);

        beforeEach(() => {
            sinon.stub(AccountUpdater, "updateOneAccount").returns(null);
        });

        it("calls updateOneAccount for every account", () => {
            browser.cloudFile = {
                getAllAccounts: sinon.fake.resolves([{ id: 1, }, { id: 2, }]),
            };
            AccountUpdater.update_all();
            expect(AccountUpdater.updateOneAccount.callCount).to.equal(2);
            expect(AccountUpdater.updateOneAccount.getCall(0).firstArg).to.equal(1);
            expect(AccountUpdater.updateOneAccount.getCall(1).firstArg).to.equal(2);
        });
        it("does nothing if no account is configured", () => {
            browser.cloudFile = { getAllAccounts: sinon.fake.resolves([]) };
            AccountUpdater.update_all();
            expect(AccountUpdater.updateOneAccount.called).to.be.false;
        });
    });

    describe('updateOneAccount', () => {
        /** @todo Add tests */
        it("loads the account");
        it("calls upgradeOld... on it");
        it("updates the account from the cloud if the necessary info is in it");
        it("doesn't update from the cloud if the serverUrl is missing ");
        it("doesn't update from the cloud if the username is missing ");
        it("doesn't update from the cloud if the password is missing ");
        it("calls upgradeConfigured");
        it("stores the account");
    });
    describe('upgradeOldConfiguration', () => {
        it("does nothing if there ist no storageFolder");
        it("does nothing if storageFolder endswith /");
        it("Add a / if storeFolder doesn't end with one");
    });

});
