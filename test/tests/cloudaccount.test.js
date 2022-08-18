import { CloudAccount } from "../../src/common/cloudaccount.js";
import { CloudAPI } from "../../src/common/cloudapi.js";

describe("CloudAccount constructor", () => {
    it("copies the parameters into properties", () => {
        const cloudaccount = new CloudAccount("teststring");
        expect(cloudaccount).to.have.property('_accountId', 'teststring');
    });
});

describe("CloudAccount.setDefaults", () => {
    /** @todo */
});

describe("CloudAccount.store", () => {
    /** @todo */
});

describe("CloudAccount.load", () => {
    /** @todo */
});

describe("CloudAccount.deleteAccount", () => {
    /** @todo */
});

describe("CloudAccount.updateFreeSpaceInfo", () => {
    /** @todo */
});

describe("CloudAccount.updateCapabilities", () => {
    /** @todo */
});

describe("CloudAccount.updateConfigured", () => {
    /** @todo */
});

describe("CloudAccount.updateUserId", () => {
    /** @todo */
});

describe("CloudAccount.updateFromCloud", () => {
    /** @todo */
});

describe("CloudAccount.convertToApppassword", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("sets the account's password to the app password returned by the web service", async () => {
        sinon.stub(CloudAPI, "getAppPassword").resolves("app-password");
        sinon.stub(CloudAPI, "getUserId").resolves("id");

        const cloudaccount = new CloudAccount("account1");
        cloudaccount.password = "password";

        await cloudaccount.convertToApppassword();
        expect(cloudaccount.password).to.equal("app-password");
    });
    it("does not change the password if the web service does not return one", async () => {
        sinon.stub(CloudAPI, "getAppPassword").resolves(null);

        const cloudaccount = new CloudAccount("account2");
        cloudaccount.password = "password";

        await cloudaccount.convertToApppassword();
        expect(cloudaccount.password).to.equal("password");

    });
    it("does not change the password if the app password does not work", async () => {
        sinon.stub(CloudAPI, "getAppPassword").resolves("app-password");
        sinon.stub(CloudAPI, "getUserId").resolves(null);

        const cloudaccount = new CloudAccount("account3");
        cloudaccount.password = "password";

        await cloudaccount.convertToApppassword();
        expect(cloudaccount.password).to.equal("password");
    });
});

describe("CloudAccount.validateDLPassword", () => {
    /** @todo */
});
