import { AccountUpdater } from "../../src/background/accountupdater.js";
import { CloudAccount } from "../../src/common/cloudaccount.js";
const expect = chai.expect;

describe("AccountUpdater", () => {
    describe('update_all', () => {
        afterEach(sinon.restore);

        beforeEach(() => {
            sinon.stub(AccountUpdater, "updateOneAccount").resolves(null);
        });

        it("is a static method", () => {
            expect(AccountUpdater).to.itself.respondTo("update_all");
        });

        it("calls updateOneAccount for every account", async () => {
            /** @todo this breaks the following tests */
            browser.cloudFile = {
                getAllAccounts: sinon.fake.resolves([{ id: 1, }, { id: 2, }]),
            };
            await AccountUpdater.update_all();
            expect(AccountUpdater.updateOneAccount.callCount).to.equal(2);
            expect(AccountUpdater.updateOneAccount.getCall(0).firstArg).to.equal(1);
            expect(AccountUpdater.updateOneAccount.getCall(1).firstArg).to.equal(2);
        });
        it("does nothing if no account is configured", () => {
            /** @todo this breaks the following tests */
            browser.cloudFile = { getAllAccounts: sinon.fake.resolves([]) };
            AccountUpdater.update_all();
            expect(AccountUpdater.updateOneAccount.called).to.be.false;
        });
    });

    describe('updateOneAccount', () => {
        afterEach(sinon.restore);

        beforeEach(() => {
            sinon.stub(CloudAccount.prototype, "load").resolves();
            sinon.stub(CloudAccount.prototype, "updateFromCloud").returns();
            sinon.stub(CloudAccount.prototype, "updateConfigured").resolves({});
            sinon.stub(CloudAccount.prototype, "store").resolves();
            sinon.stub(AccountUpdater, "upgradeOldConfiguration");
        });

        it("is a static method", () => {
            expect(AccountUpdater).to.itself.respondTo("updateOneAccount");
        });
        it("loads the account", async () => {
            await AccountUpdater.updateOneAccount();
            expect(CloudAccount.prototype.load.called).to.be.true;
        });
        it("calls updateOneAccount on it", async () => {
            await AccountUpdater.updateOneAccount("test");
            expect(AccountUpdater.upgradeOldConfiguration.called).to.be.true;
            expect(AccountUpdater.upgradeOldConfiguration.lastCall.firstArg).to.deep.equal({ _accountId: 'test', });
        });
        it("updates the account from the cloud if the necessary info is in it", async () => {
            CloudAccount.prototype.load.callsFake(async function () {
                this.username = this.password = this.serverUrl = "present";
            });
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.updateFromCloud.called).to.be.true;
        });
        it("doesn't update from the cloud if the serverUrl is missing ", async () => {
            CloudAccount.prototype.load.callsFake(async function () {
                this.username = this.password = "present";
            });
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.updateFromCloud.called).to.be.false;
        });
        it("doesn't update from the cloud if the username is missing ", async () => {
            CloudAccount.prototype.load.callsFake(async function () {
                this.serverUrl = this.password = "present";
            });
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.updateFromCloud.called).to.be.false;
        });
        it("doesn't update from the cloud if the password is missing ", async () => {
            CloudAccount.prototype.load.callsFake(async function () {
                this.username = this.serverUrl = "present";
            });
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.updateFromCloud.called).to.be.false;
        });
        it("calls updateConfigured", async () => {
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.updateConfigured.called).to.be.true;
        });
        it("stores the account", async () => {
            await AccountUpdater.updateOneAccount("test");
            expect(CloudAccount.prototype.store.called).to.be.true;
        });
    });

    describe('upgradeOldConfiguration', () => {
        it("is a static method", () => {
            expect(AccountUpdater).to.itself.respondTo("update_all");
        });
        it("does nothing if there is no storageFolder", () => {
            const input = { username: "user", };
            const cloudaccount = input;
            AccountUpdater.upgradeOldConfiguration(cloudaccount);
            expect(cloudaccount).to.deep.equal(input);

        });
        it("does nothing if storageFolder ends with /", () => {
            const input = { storageFolder: "path/", username: "user", };
            const cloudaccount = input;
            AccountUpdater.upgradeOldConfiguration(cloudaccount);
            expect(cloudaccount).to.deep.equal(input);

        });
        it("adds a / if storeFolder doesn't end with one", () => {
            const input = { storageFolder: "path/", username: "user", };
            const cloudaccount = input;
            AccountUpdater.upgradeOldConfiguration(cloudaccount);
            expect(cloudaccount.storageFolder).to.equal("path/");

        });
    });

});
