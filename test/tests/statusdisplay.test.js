// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { StatusDisplay } from "../../src/compose_action/statusdisplay.js";
import { UploadStatus } from "../../src/common/uploadstatus.js";
import { Statuses } from "../../src/common/statuses.js";
const expect = chai.expect;

describe('StatusDisplay', () => {
    describe('update', () => {
        beforeEach("Insert HTML elements", () => {
            const t = document.createElement("template");
            t.innerHTML = `<div id="fake_popup">
            <div id="no_uploads" data-message="status_no_uploads"></div>
            <div id="status_lines"> </div>
            <button id="button_clear" class="button--primary button--micro hidden" data-message="status_button_clear"></button>
        
            <template id="template_copy">
                <div class="copy">
                    <button class="button--micro hidden"><img src="Copy.svg" alt="Copy"></button>
                </div>
            </template>
        
            <template id="template_cell">
                <div class="cell"></div>
            </template>
            </div>`;
            const c = t.content.cloneNode(true);
            document.querySelector("body").appendChild(c);
        });
        afterEach("Remove HTML elements", () => {
            const fake = document.querySelector("#fake_popup");
            fake.remove();
        });

        let old_browser;
        beforeEach('stub localization', () => {
            old_browser = browser.i18n;
            browser.i18n = { getMessage: sinon.fake.returns("localized"), };
        });
        afterEach('restore localization', () => {
            browser.i18n = old_browser;
        });

        it('is a static method', () => {
            expect(StatusDisplay).itself.to.respondTo("update");
        });
        it('is not an async method', () => {
            const uploads = new Map();
            expect(StatusDisplay.update(uploads)).not.to.be.a("Promise");
        });
        it('displays the "no_uploads" message if there are no uploads', () => {
            const uploads = new Map();
            StatusDisplay.update(uploads);
            expect(document.querySelector("#no_uploads").classList.contains("hidden")).to.be.false;
        });
        it('empties the "status_lines" grid if there are no uploads', () => {
            const uploads = new Map();
            StatusDisplay.update(uploads);
            expect(document.querySelector("#status_lines").firstChild).to.be.null;
        });
        it('displays the "no_uploads" message if all uploads are removed', () => {
            document.querySelector("#no_uploads").classList.add("hidden");
            const uploads = new Map();
            StatusDisplay.update(uploads);
            expect(document.querySelector("#no_uploads").classList.contains("hidden")).to.be.false;
        });
        it('empties the "status_lines" grid if all uploads are removed', () => {
            const sl = document.querySelector("#status_lines");
            sl.appendChild(document.createTextNode("Hello world!"));
            const uploads = new Map();
            StatusDisplay.update(uploads);
            expect(sl.firstChild).to.be.null;
        });
        it('hides the "no_uploads" message if there is an upload', () => {
            const uploads = new Map([["uid", new UploadStatus("filename")]]);
            StatusDisplay.update(uploads);
            expect(document.querySelector("#no_uploads").classList.contains("hidden")).to.be.true;
        });
        it('hides the clear button if there are no uploads', () => {
            const uploads = new Map();
            StatusDisplay.update(uploads);
            const classlist = document.querySelector("#button_clear").classList;
            expect(classlist.contains("hidden")).to.be.true;
        });
        it('hides the clear button if all uploads are removed', () => {
            const classlist = document.querySelector("#button_clear").classList;
            classlist.remove("hidden");
            const uploads = new Map();
            StatusDisplay.update(uploads);
            expect(classlist.contains("hidden")).to.be.true;
        });
        it('shows the clear button if one upload is in error state', () => {
            const us = new UploadStatus("filename");
            us.error = true;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const classlist = document.querySelector("#button_clear").classList;
            expect(classlist.contains("hidden")).to.be.false;
        });
        it('shows the clear button if one upload has a generated password', () => {
            const us = new UploadStatus("filename");
            us.status = Statuses.GENERATEDPASSWORD;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const classlist = document.querySelector("#button_clear").classList;
            expect(classlist.contains("hidden")).to.be.false;
        });
        it('hides the clear button if there are only uploads, but none in error or w/ password', () => {
            const uploads = new Map();
            for (const key in Statuses) {
                if (key == "GENERATEDPASSWORD") {
                    continue;
                }
                const us = new UploadStatus(key);
                us.status = Statuses[key];
                us.error = false;
                uploads.set(key, us);
            }
            StatusDisplay.update(uploads);
            const classlist = document.querySelector("#button_clear").classList;
            expect(classlist.contains("hidden")).to.be.true;
        });

        it('displays the file name for an upload', () => {
            const uploads = new Map([["uid", new UploadStatus("filename")]]);
            StatusDisplay.update(uploads);
            const sl = document.querySelector("#status_lines");
            expect(sl.firstChild.textContent).to.equal("filename");
        });
        it('adds the error class to the status of an upload that is in error state', () => {
            const us = new UploadStatus("filename");
            us.error = true;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const status_div = document.querySelectorAll("#status_lines>.cell")[1];
            expect(status_div.classList.contains("error")).to.be.true;
        });
        it('adds the error errors sting to the status of an upload that is in error state', () => {
            const us = new UploadStatus("filename");
            us.error = true;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            expect(browser.i18n.getMessage.firstArg).to.equal("status_error");
            // The second string is already localized by a previous call
            expect(browser.i18n.getMessage.lastArg).to.equal("localized");
        });
        it('combines a generated password with a localized label', () => {
            const us = new UploadStatus("filename");
            us.status = Statuses.GENERATEDPASSWORD;
            us.password = "password";
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            expect(browser.i18n.getMessage.firstArg).to.equal("status_password");
            expect(browser.i18n.getMessage.lastArg).to.equal("password");
        });
        it('fills the second grid cell if there is a generated password', () => {
            const us = new UploadStatus("filename");
            us.status = Statuses.GENERATEDPASSWORD;
            us.password = "password";
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const status_div = document.querySelectorAll("#status_lines>.cell")[1];
            expect(status_div.textContent).to.equal("localized");
        });
        it('inserts a progress element into the second grid cell if an upload is in progress', () => {
            const us = new UploadStatus("filename");
            us.status = Statuses.UPLOADING;
            us.progress = 0;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const status_div = document.querySelectorAll("#status_lines>.cell")[1];
            expect(status_div.firstChild).is.a("HTMLProgressElement");
        });
        it('sets the progress value', () => {
            const test_value = 0.31415923;
            const us = new UploadStatus("filename");
            us.status = Statuses.UPLOADING;
            us.progress = test_value;
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const status_div = document.querySelectorAll("#status_lines>.cell")[1];
            expect(status_div.firstChild.value).to.equal(test_value);
        });
        it('gets the localized value for the status', () => {
            const uploads = new Map([["uid", new UploadStatus("filename")]]);
            StatusDisplay.update(uploads);
            expect(browser.i18n.getMessage.firstArg).to.equal("status_preparing");
        });
        it('gets the localized value for the status into the second grid cell', () => {
            const uploads = new Map([["uid", new UploadStatus("filename")]]);
            StatusDisplay.update(uploads);
            const status_div = document.querySelectorAll("#status_lines>.cell")[1];
            expect(status_div.textContent).to.equal("localized");
        });
        it('adds a button into the third grid cell, regardless of status', () => {
            const uploads = new Map([["uid", new UploadStatus("filename")]]);
            StatusDisplay.update(uploads);
            const copy_button = document.querySelector("#status_lines>.copy>button");
            expect(copy_button).is.not.undefined;
        });
        for (const key in Statuses) {
            if (key == "GENERATEDPASSWORD") {
                continue;
            }
            it('hides the copy button if the status is ' + key, () => {
                const uploads = new Map();
                const us = new UploadStatus(key);
                us.status = Statuses[key];
                us.error = false;
                uploads.set(key, us);
                StatusDisplay.update(uploads);
                const classlist = document.querySelector("#status_lines>.copy>button").classList;
                expect(classlist.contains("hidden")).to.be.true;
            });
        }
        it('shows the copy button if there is a generated password', () => {
            const us = new UploadStatus("filename");
            us.status = Statuses.GENERATEDPASSWORD;
            us.password = "password";
            const uploads = new Map([["uid", us]]);
            StatusDisplay.update(uploads);
            const classlist = document.querySelector("#status_lines>.copy>button").classList;
            expect(classlist.contains("hidden")).to.be.false;
        });
        for (const key in Statuses) {
            if (key == "GENERATEDPASSWORD") {
                continue;
            }
            it('does not add the click handler to the button if the state is ' + key, () => {
                const uploads = new Map();
                const us = new UploadStatus(key);
                us.status = Statuses[key];
                us.error = false;
                uploads.set(key, us);
                StatusDisplay.update(uploads);
                sinon.spy(navigator.clipboard, "writeText");
                document.querySelector("#status_lines>.copy>button").click();
                expect(navigator.clipboard.writeText.called).to.be.false;
                sinon.restore();
            });
        }
        it('does  add the click handler to the button if there is a generated password ', () => {
            const uploads = new Map();
            const us = new UploadStatus("filename");
            us.status = Statuses.GENERATEDPASSWORD;
            us.password = "password";
            us.error = false;
            uploads.set("uid", us);
            StatusDisplay.update(uploads);
            sinon.spy(navigator.clipboard, "writeText");
            document.querySelector("#status_lines>.copy>button").click();
            expect(navigator.clipboard.writeText.called).to.be.true;
            expect(navigator.clipboard.writeText.calledWith("password")).to.be.true;
            sinon.restore();
        });
    });
});