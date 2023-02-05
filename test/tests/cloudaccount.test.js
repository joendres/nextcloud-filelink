// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CloudAccount } from "../../src/common/cloudaccount.js";
import { CloudAPI } from "../../src/common/cloudapi.js";

const expect = chai.expect;

describe("CloudAccount", () => {

    describe("constructor", () => {
        it("copies the parameters into properties", () => {
            const cloudaccount = new CloudAccount("teststring");
            expect(cloudaccount).to.eql({ '_accountId': 'teststring' });
        });
    });

    describe("setDefaults", () => {
        it("sets the properties of the account to the values defined in defaults", () => {
            const cloudaccount = new CloudAccount("setDefaults");
            cloudaccount.setDefaults();

            expect(cloudaccount).to.eql({
                _accountId: "setDefaults",
                storageFolder: "/Mail-attachments",
                expiryDays: 7,
                useNoDlPassword: true,
            });
        });
    });

    describe("store", async () => {
        it("stores all properties of the account in local storage", async () => {
            const cloudaccount = new CloudAccount("store");
            Object.assign(cloudaccount, {
                storageFolder: "/Mail-attachments",
                expiryDays: 7,
                useNoDlPassword: true,
            });
            await cloudaccount.store();

            const stored_data = await browser.storage.local.get("store");
            expect(stored_data.store).to.deep.equal({
                _accountId: "store",
                storageFolder: "/Mail-attachments",
                expiryDays: 7,
                useNoDlPassword: true,
            });
        });
    });

    describe("load", () => {
        it("loads all properties from local storage", async () => {
            const stored_data = { x: "y", answer: 42, truthy: false, };
            await browser.storage.local.set({ load: stored_data });

            const cloud_account = new CloudAccount("load");
            await cloud_account.load();
            for (const key in stored_data) {
                expect(cloud_account[key]).to.equal(stored_data[key]);
            }
        });
        it("just loads no data if the account has not been stored before", async () => {
            const cloud_account = new CloudAccount("empty");
            await cloud_account.load();
            expect(Object.keys(cloud_account)).to.have.lengthOf(1);

        });
    });

    describe("delete", () => {
        it("removes the account from storage", async () => {
            const cloud_account = new CloudAccount("remove");
            cloud_account.answer = 42;
            cloud_account.store();

            cloud_account.delete();
            const allAccounts = await browser.storage.local.get();

            expect(allAccounts).not.to.have.property("remove");
        });
    });

    describe("updateFreeSpaceInfo", () => {
        afterEach(sinon.restore);

        const test_data = {
            "not quota": { input: {}, output: [-1, -1,] },
            "too much free space": { input: { free: Number.MAX_SAFE_INTEGER + 1, }, output: [-1, -1,] },
            "negative free space": { input: { free: -42, }, output: [-1, -1,] },
            "no total and no used": { input: { free: 42, }, output: [-1, -1,] },
            "less total than free space": { input: { free: 42, total: 7, }, output: [-1, -1,] },
            "negative total space": { input: { free: 42, total: -7, }, output: [-1, -1,] },
            "too much total space": { input: { free: 42, total: Number.MAX_SAFE_INTEGER + 1, }, output: [-1, -1,] },
            "sensible data": { input: { free: 42, total: 43, }, output: [42, 43,] },
            "no total but used": { input: { free: 42, used: 1, }, output: [42, 43,] },
            "negative total but used": { input: { free: 42, total: -1, used: 1, }, output: [42, 43,] },
            "too much total but used": { input: { free: 42, total: Number.MAX_SAFE_INTEGER + 1, used: 1, }, output: [42, 43,] },
        };

        function test_return(data) {
            return async () => {
                sinon.stub(CloudAPI, "getQuota").resolves(data.input);
                const cloudaccount = new CloudAccount("getQuota");

                expect(await cloudaccount.updateFreeSpaceInfo()).to.equal(data.output[0]);
            };
        }

        function test_copy(data) {
            return async () => {
                sinon.stub(CloudAPI, "getQuota").resolves(data.input);
                const cloudaccount = new CloudAccount("getQuota");
                await cloudaccount.updateFreeSpaceInfo();

                expect(cloudaccount.free).to.equal(data.output[0]);
                expect(cloudaccount.total).to.equal(data.output[1]);
            };
        }

        for (const key in test_data) {
            it("returns " + test_data[key].output[0] + " if the web service returns " + key, test_return(test_data[key]));
            it("copies data to free and total if the web service returns " + key, test_copy(test_data[key]));
        }
    });

    describe("updateCapabilities", () => {
        /** @todo Add tests */
    });

    describe("updateConfigured", () => {
        // This only works because the return value is not used
        let save_cloudfile;

        after(() => {
            sinon.restore();
            browser.cloudFile = save_cloudfile;
        });

        before(() => {
            save_cloudfile = browser.cloudFile;
            browser.cloudFile = { updateAccount: sinon.fake.resolves({}) };
        });

        const full_data = {
            public_shares_enabled: true,
            serverUrl: "https://exmple.com/",
            username: "username",
            userId: "userid",
            password: "password",
            storageFolder: "/folder",
        };

        it("sets configured to true if the necessary properties are set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });

        for (const key in full_data) {
            it(`sets configured to false if ${key} is missing`, async () => {
                const cloudaccount = new CloudAccount("updateConfigured");
                Object.assign(cloudaccount, full_data);
                delete cloudaccount[key];
                await cloudaccount.updateConfigured();

                expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
            });
        }

        for (const key in full_data) {
            it(`sets configured to false if ${key} is an empty string`, async () => {
                const cloudaccount = new CloudAccount("updateConfigured");
                Object.assign(cloudaccount, full_data);
                cloudaccount[key] = "";
                await cloudaccount.updateConfigured();

                expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
            });
        }

        it("sets configured to true if password is enforced and onePassword (and a password) is set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.enforce_password = true;
            cloudaccount.oneDLPassword = true;
            cloudaccount.downloadPassword = "dl_pw";

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });
        it("sets configured to false if password is enforced and onePassword is set, but no password", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.enforce_password = true;
            cloudaccount.oneDLPassword = true;
            delete cloudaccount.downloadPassword;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to true if password is enforced and generatePassword is set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.enforce_password = true;
            cloudaccount.useGeneratedDlPassword = true;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });
        it("sets configured to false if password is enforced and neither onePassword nor generatPassword is set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.enforce_password = true;
            cloudaccount.useGeneratedDlPassword = false;
            cloudaccount.oneDLPassword = false;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });

        it("sets configured to false if onePassword is set, but no password", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.oneDLPassword = true;
            delete cloudaccount.downloadPassword;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });

        it("sets configured to false if expiry is active but no date set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.useExpiry = true;
            delete cloudaccount.expiryDays;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to true if expiry is active and a date is set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.useExpiry = true;
            cloudaccount.expiryDays = 7;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });
        it("sets configured to true if max_expiry is set but expiry is not active", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = false;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });
        it("sets configured to false if max_expiry is set and expiry is active but the expiry date is missing", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = true;
            delete cloudaccount.expiryDays;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to false if max_expiry is set and expiry is active but the expiry date too late", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = true;
            cloudaccount.expiryDays = cloudaccount.expiry_max_days + 1;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to true if max_expiry is set and expiry is active and the expiry date is ok", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = true;
            cloudaccount.expiryDays = cloudaccount.expiry_max_days;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });

        it("sets configured to false if expiry is enforced but expiry is not active", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_enforced = true;
            cloudaccount.useExpiry = false;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to false if expiry is enforced but no expiry is set", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_enforced = true;
            cloudaccount.useExpiry = true;
            delete cloudaccount.expiryDays;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to false if expiry is enforced but expiry is too late", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_enforced = true;
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = true;
            cloudaccount.expiryDays = cloudaccount.expiry_max_days + 1;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: false, });
        });
        it("sets configured to true if expiry is enforced and expiry is ok", async () => {
            const cloudaccount = new CloudAccount("updateConfigured");
            Object.assign(cloudaccount, full_data);
            cloudaccount.expiry_enforced = true;
            cloudaccount.expiry_max_days = 7;
            cloudaccount.useExpiry = true;
            cloudaccount.expiryDays = cloudaccount.expiry_max_days - 1;

            await cloudaccount.updateConfigured();

            expect(browser.cloudFile.updateAccount.lastCall.lastArg).to.eql({ configured: true, });
        });
    });

    describe("updateUserId", () => {
        afterEach(sinon.restore);

        it("returns false if CloudAPI.getUserId returns null", async () => {
            sinon.stub(CloudAPI, "getUserId").resolves(null);

            const cloudaccount = new CloudAccount("getUserId");

            expect(await cloudaccount.updateUserId()).to.be.false;
        });
        it("returns true if CloudAPI.getUserId returns a string", async () => {
            sinon.stub(CloudAPI, "getUserId").resolves("userid");

            const cloudaccount = new CloudAccount("getUserId");

            expect(await cloudaccount.updateUserId()).to.be.true;
        });
        it("does not change the userId if CloudAPI.getUserId returns null", async () => {
            // Thunderbird might be offline and then should not overwrite a valid userId
            sinon.stub(CloudAPI, "getUserId").resolves(null);

            const cloudaccount = new CloudAccount("getUserId");
            cloudaccount.userId = "user";
            await cloudaccount.updateUserId();

            expect(cloudaccount.userId).to.equal("user");
        });
        it("stores the CloudAPI.getUserId result in the account if it only contains allowed characters", async () => {
            const userId = "j_e@johannes-endres.de";
            sinon.stub(CloudAPI, "getUserId").resolves(userId);

            const cloudaccount = new CloudAccount("getUserId");
            cloudaccount.userId = "user";
            await cloudaccount.updateUserId();

            expect(cloudaccount.userId).to.be.equal(userId);
        });
        it("stores an URI encoded string if the UserId only contains special characters", async () => {
            const valid_id = "(je#EXT#@johannes-endres.de)";
            sinon.stub(CloudAPI, "getUserId").resolves(valid_id);

            const cloudaccount = new CloudAccount("getUserId");
            cloudaccount.userId = "user";
            await cloudaccount.updateUserId();

            expect(cloudaccount.userId).to.be.equal("%28je%23EXT%23%40johannes-endres.de%29");
        });
    });

    describe("updateFromCloud", () => {
        afterEach(sinon.restore);

        it("calls updateFreeSpaceInfo and updateCapabilities if there is a valid userId", async () => {
            const cloudaccount = new CloudAccount("updateFromCloud");
            sinon.stub(cloudaccount, "updateCapabilities").resolves();
            sinon.stub(cloudaccount, "updateFreeSpaceInfo").resolves();
            sinon.stub(cloudaccount, "updateUserId").resolves(true);

            await cloudaccount.updateFromCloud();

            expect(cloudaccount.updateCapabilities.called).to.be.true;
            expect(cloudaccount.updateFreeSpaceInfo.called).to.be.true;
        });
        it("does not call updateFreeSpaceInfo and updateCapabilities if there is no valid userId", async () => {
            const cloudaccount = new CloudAccount("updateFromCloud");
            sinon.stub(cloudaccount, "updateCapabilities").resolves();
            sinon.stub(cloudaccount, "updateFreeSpaceInfo").resolves();
            sinon.stub(cloudaccount, "updateUserId").resolves(false);

            await cloudaccount.updateFromCloud();

            expect(cloudaccount.updateCapabilities.called).to.be.false;
            expect(cloudaccount.updateFreeSpaceInfo.called).to.be.false;
        });
        it("does not change the username if no userid can be retrieved", async () => {
            const username = "username";
            const cloudaccount = new CloudAccount("updateFromCloud");
            cloudaccount.username = username;
            sinon.stub(cloudaccount, "updateCapabilities").resolves();
            sinon.stub(cloudaccount, "updateFreeSpaceInfo").resolves();
            sinon.stub(cloudaccount, "updateUserId").resolves(false);

            await cloudaccount.updateFromCloud();

            expect(cloudaccount.username).to.equal(username);
        });
        it("does change the username to lowercase if necessary", async () => {
            const cloudaccount = new CloudAccount("updateFromCloud");
            cloudaccount.username = "UserName";
            sinon.stub(cloudaccount, "updateCapabilities").resolves();
            sinon.stub(cloudaccount, "updateFreeSpaceInfo").resolves();
            sinon.stub(cloudaccount, "updateUserId").
                onCall(0).
                resolves(false).
                onCall(1).
                resolves(true);

            await cloudaccount.updateFromCloud();

            expect(cloudaccount.username).to.equal("username");
        });
    });

    describe("convertToApppassword", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("sets the account's password to the app password returned by the web service", async () => {
            sinon.stub(CloudAPI, "getAppPassword").resolves("app-password");
            sinon.stub(CloudAPI, "getUserId").resolves("id");

            const cloudaccount = new CloudAccount("convertToApppassword1");
            cloudaccount.password = "password";

            await cloudaccount.convertToApppassword();
            expect(cloudaccount.password).to.equal("app-password");
        });
        it("does not change the password if the web service does not return one", async () => {
            sinon.stub(CloudAPI, "getAppPassword").resolves(null);

            const cloudaccount = new CloudAccount("convertToApppassword2");
            cloudaccount.password = "password";

            await cloudaccount.convertToApppassword();
            expect(cloudaccount.password).to.equal("password");

        });
        it("does not change the password if the app password does not work", async () => {
            sinon.stub(CloudAPI, "getAppPassword").resolves("app-password");
            sinon.stub(CloudAPI, "getUserId").resolves(null);

            const cloudaccount = new CloudAccount("convertToApppassword3");
            cloudaccount.password = "password";

            await cloudaccount.convertToApppassword();
            expect(cloudaccount.password).to.equal("password");
        });
    });

    describe("validateDLPassword", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("returns true if CloudAPI.validateDownloadPassword does", async () => {
            sinon.stub(CloudAPI, "validateDownloadPassword").resolves(true);

            const cloud_account = new CloudAccount("validate");
            expect(await cloud_account.validateDLPassword()).to.be.true;
        });
        it("returns false if CloudAPI.validateDownloadPassword does", async () => {
            sinon.stub(CloudAPI, "validateDownloadPassword").resolves(false);

            const cloud_account = new CloudAccount("validate");
            expect(await cloud_account.validateDLPassword()).to.be.false;
        });
        it("returns true if CloudAPI.validateDownloadPassword returns null and downloadPassword is not empty", async () => {
            sinon.stub(CloudAPI, "validateDownloadPassword").resolves(null);

            const cloud_account = new CloudAccount("validate");
            cloud_account.downloadPassword = "password";
            expect(await cloud_account.validateDLPassword()).to.be.true;
        });
        it("returns false if CloudAPI.validateDownloadPassword returns null and downloadPassword is not präsent", async () => {
            sinon.stub(CloudAPI, "validateDownloadPassword").resolves(null);

            const cloud_account = new CloudAccount("validate");
            delete cloud_account.downloadPassword;
            expect(await cloud_account.validateDLPassword()).to.be.false;
        });
    });
});
