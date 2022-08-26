import { HeaderHandler } from "../../src/management/headerhandler.js";
const expect = chai.expect;

describe("HeaderHandler", () => {
    describe('updateFreespace', () => {
        var freespaceinfo, freespacelabel, freespace;
        beforeEach(() => {
            freespaceinfo = document.createElement("div");
            freespacelabel = document.createElement("label");
            freespace = document.createElement("meter");
            sinon.stub(document, "querySelector").
                withArgs("#freespaceinfo").returns(freespaceinfo).
                withArgs("#freespacelabel").returns(freespacelabel).
                withArgs("#freespace").returns(freespace);
        });
        afterEach(() => {
            sinon.restore();
            freespace.remove();
            freespaceinfo.remove();
            freespacelabel.remove();
        });

        it("hides the free space display if the free space is -1", () => {
            HeaderHandler.updateFreespace({
                free: -1,
                total: 100,
            });
            expect(freespaceinfo.hidden).to.be.true;
        });
        it("hides the free space display if the total space is -1", () => {
            HeaderHandler.updateFreespace({
                free: 111,
                total: -1,
            });
            expect(freespaceinfo.hidden).to.be.true;
        });
        it("shows the free space display if both values are positive", () => {
            HeaderHandler.updateFreespace({
                free: 10,
                total: 100,
            });
            expect(freespaceinfo.hidden).to.be.false;
        });
        it("localizes and shows the free space info line", () => {
            browser.i18n.getMessage = sinon.fake.returns("localized");
            HeaderHandler.updateFreespace({
                free: 10,
                total: 100,
            });
            expect(browser.i18n.getMessage.called).to.be.true;
            expect(browser.i18n.getMessage.lastCall.firstArg).to.equal("freespace");
            expect(browser.i18n.getMessage.lastCall.lastArg).to.deep.equal(["10B", "100B",]);
            expect(freespacelabel.textContent).to.equal("localized");
        });
        it("sets the meter display to the values from the account", () => {
            HeaderHandler.updateFreespace({
                free: 10,
                total: 100,
            });
            expect(freespace.max).to.eql(100);
            expect(freespace.value).to.eql(10);
            expect(freespace.low).to.eql(5);
        });
    });

    describe('humanReadable', () => {
        const decimal_separator = (1.1).toLocaleString().match(/^1(.)1$/)[1];
        console.debug(decimal_separator);
        [
            [1, "1B"],
            [10, "10B"],
            [100, "100B"],
            [1000, "1KB"],
            [10000, "10KB"],
            [100000, "100KB"],
            [1000000, "1MB"],
            [1000000000, "1GB"],
            [1000000000000, "1TB"],
            [1000000000000000, "1PB"],
            [900, "900B"],
            [2 ** 53 - 1, "9" + decimal_separator + "01PB"],
            [1234, "1" + decimal_separator + "23KB"],
            [1200, "1" + decimal_separator + "2KB"],
            [1239, "1" + decimal_separator + "24KB"],
            [1299, "1" + decimal_separator + "3KB"],
        ].
            forEach(data => {
                it('returns ' + data[1] + ' for ' + data[0], () => {
                    expect(HeaderHandler.humanReadable(data[0])).to.equal(data[1]);
                });
            });
        it("throws a ReferenceError if the argument is too big", () => {
            expect(() => HeaderHandler.humanReadable(Number.MAX_SAFE_INTEGER + 1)).to.throw(RangeError);
        });
        it("throws a ReferenceError if the argument is below 0", () => {
            expect(() => HeaderHandler.humanReadable(-1)).to.throw(RangeError);
        });

    });

    describe('updateCloudVersion', () => {
        var logo, label_version, provider_name;
        beforeEach(() => {
            logo = document.createElement("img");
            label_version = document.createElement("div");
            provider_name = document.createElement("h1");
            sinon.stub(document, "querySelector").
                withArgs("#provider_name").returns(provider_name).
                withArgs("#label_version").returns(label_version).
                withArgs("#logo").returns(logo);
        });
        afterEach(() => {
            sinon.restore();
            logo.remove();
            label_version.remove();
            provider_name.remove();
        });

        it("shows the Nextcloud logo for Nextcloud", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Nextcloud",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(logo.src).to.match(/nextcloud-logo.svg$/);
        });
        it("shows the ownCloud logo for ownCloud", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "ownCloud",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(logo.src).to.match(/owncloud-logo.svg$/);
        });
        it("shows the *cloud logo if an unsupported cloud type is present", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Unsupported",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(logo.src).to.match(/icon48.png$/);
        });
        it("shows the *cloud logo if no cloud type is present", () => {
            HeaderHandler.updateCloudVersion({
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(logo.src).to.match(/icon48.png$/);
        });
        it("shows the cloud name if it is set", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Unsupported",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(provider_name.textContent).to.equal("name");
        });
        it("shows *cloud if no cloud name is present", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Unsupported",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
            });
            expect(provider_name.textContent).to.equal("*cloud");
        });
        it("shows the cloud version if it is present", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Unsupported",
                cloud_versionstring: "1.2.3",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(label_version.textContent).to.equal("1.2.3");
        });
        it("empties the version line if no cloud version is present", () => {
            HeaderHandler.updateCloudVersion({
                cloud_type: "Unsupported",
                cloud_supported: true,
                cloud_productname: "name",
            });
            expect(label_version.textContent).to.equal("");
        });
    });
});