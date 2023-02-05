// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { AccountFieldHandler } from "../../src/management/accountfieldhandler.js";
import { DownloadPasswordFieldHandler } from "../../src/management/downloadpasswordfieldhandler.js";
import { ExpiryFieldHandler } from "../../src/management/expiryfieldhandler.js";
import { FolderFieldHandler } from "../../src/management/folderfieldhandler.js";
import { FormHandler } from "../../src/management/formhandler.js";
import { HeaderHandler } from "../../src/management/headerhandler.js";
import { Popup } from "../../src/management/popup/popup.js";
const expect = chai.expect;

describe("FormHandler", () => {
    describe('updateButtons', () => {
        beforeEach(() => {
            sinon.stub(document, "querySelector");
            const saveButton = document.createElement("button");
            document.querySelector.withArgs("#saveButton").returns(saveButton);
            const resetButton = document.createElement("button");
            document.querySelector.withArgs("#resetButton").returns(resetButton);
            const accountForm = document.createElement("form");
            document.querySelector.withArgs("#accountForm").returns(accountForm);
            sinon.stub(accountForm, "checkValidity").returns(true);
        });
        afterEach(() => {
            document.querySelector("#saveButton").remove();
            document.querySelector("#resetButton").remove();
            document.querySelector("#accountForm").remove();
            sinon.restore();
        });

        it("is a static method", () => {
            expect(FormHandler).itself.to.respondTo("updateButtons");
        });
        it("is not an async method", () => {
            expect(FormHandler.updateButtons()).not.to.be.a("Promise");
        });
        it("checks the validity of the input values", () => {
            FormHandler.updateButtons();
            expect(document.querySelector("#accountForm").checkValidity.calledOnce).to.be.true;
        });
        it("activates the save button if the input is valid", () => {
            FormHandler.updateButtons();
            expect(document.querySelector("#saveButton").disabled).to.be.false;
        });
        it("deactivates the save button if the input is not valid", () => {
            document.querySelector("#accountForm").checkValidity.returns(false);
            FormHandler.updateButtons();
            expect(document.querySelector("#saveButton").disabled).to.be.true;
        });
        it("activates the reset button", () => {
            FormHandler.updateButtons();
            expect(document.querySelector("#resetButton").disabled).to.be.false;
        });
    });

    describe('resetHandler', () => {
        beforeEach(() => {
            sinon.stub(document, "querySelector");
            const saveButton = document.createElement("button");
            document.querySelector.withArgs("#saveButton").returns(saveButton);
            const resetButton = document.createElement("button");
            document.querySelector.withArgs("#resetButton").returns(resetButton);
            sinon.stub(FormHandler.prototype, "fillData");
            sinon.stub(Popup, "clear");
        });
        afterEach(() => {
            document.querySelector("#saveButton").remove();
            document.querySelector("#resetButton").remove();
            sinon.restore();
        });
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("resetHandler");
            expect(FormHandler).to.respondTo("resetHandler");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.resetHandler()).not.to.be.a("Promise");
        });
        it("clears the Popup", () => {
            const fh = new FormHandler("id");
            fh.resetHandler();
            expect(Popup.clear.calledOnce).to.be.true;
        });
        it("fills the form with the stored data", () => {
            const fh = new FormHandler("id");
            fh.resetHandler();
            expect(FormHandler.prototype.fillData.calledOnce).to.be.true;
        });
        it("disables the save and the reset buttons", () => {
            const fh = new FormHandler("id");
            fh.resetHandler();
            expect(document.querySelector("#saveButton").disabled).to.be.true;
            expect(document.querySelector("#resetButton").disabled).to.be.true;
        });
    });
    describe('submitHandler', () => {
        beforeEach(() => {
            sinon.stub(FormHandler.prototype);
            FormHandler.prototype.submitHandler.restore();

            sinon.stub(document, "querySelector");
            const saveButton = document.createElement("button");
            document.querySelector.withArgs("#saveButton").returns(saveButton);
            const resetButton = document.createElement("button");
            document.querySelector.withArgs("#resetButton").returns(resetButton);

            sinon.stub(FormHandler, "lookBusy");
            sinon.stub(FormHandler, "stopLookingBusy");
            sinon.stub(Popup, "clear");
            sinon.stub(Popup, "empty");
            sinon.stub(Popup, "success");
        });
        afterEach(() => {
            document.querySelector("#saveButton").remove();
            document.querySelector("#resetButton").remove();
            sinon.restore();
        });

        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("submitHandler");
            expect(FormHandler).to.respondTo("submitHandler");
        });
        it("is an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.submitHandler()).to.be.a("Promise");
        });
        it("disables the save and the reset buttons", async () => {
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(document.querySelector("#saveButton").disabled).to.be.true;
            expect(document.querySelector("#resetButton").disabled).to.be.true;
        });
        it("clears the Popup", async () => {
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(Popup.clear.calledOnce).to.be.true;
        });
        it("makes the form look busy", async () => {
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(FormHandler.lookBusy.calledOnce).to.be.true;
        });
        [
            "preCloudUpdate",
            "copyAllInputs",
            "updateFromCloud",
            "postCloudUpdate",
            "store",
            "updateConfigured",
            "fillData",
            "updateHeader",
            "showErrors",
        ].forEach((method) => {
            it("calls " + method, async () => {
                const fh = new FormHandler("id");
                await fh.submitHandler();
                expect(FormHandler.prototype[method].calledOnce).to.be.true;
            });
        });
        it("opens the success Popup if the Popup is empty", async () => {
            Popup.empty.returns(true);
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(Popup.success.called).to.be.true;
        });
        it("doesn't open the success Popup if the Popup is not empty", async () => {
            Popup.empty.returns(false);
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(Popup.success.calledOnce).to.be.false;
        });
        it("stops looking busy", async () => {
            const fh = new FormHandler("id");
            await fh.submitHandler();
            expect(FormHandler.stopLookingBusy.calledOnce).to.be.true;
        });
    });
    describe('addListeners', () => {
        beforeEach(() => {
            sinon.stub(ExpiryFieldHandler, "addListeners");
            sinon.stub(DownloadPasswordFieldHandler, "addListeners");
            sinon.stub(document, "querySelector");
            const accountForm = document.createElement("form");
            document.querySelector.withArgs("#accountForm").returns(accountForm);
        });
        afterEach(() => {
            document.querySelector("#accountForm").remove();
            sinon.restore();
        });

        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("addListeners");
            expect(FormHandler).to.respondTo("addListeners");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.addListeners()).not.to.be.a("Promise");
        });
        it("installs the oninput handler", () => {
            const fh = new FormHandler("id");
            fh.addListeners();
            expect(document.querySelector("#accountForm").oninput).to.equal(FormHandler.updateButtons);
        });
        it("installs an onsubmit handler", () => {
            const fh = new FormHandler("id");
            fh.addListeners();
            expect(document.querySelector("#accountForm").onsubmit).to.be.a("Function");
        });
        it("installs an onreset handler", () => {
            const fh = new FormHandler("id");
            fh.addListeners();
            expect(document.querySelector("#accountForm").onreset).to.be.a("Function");
        });
        it("calls ExpiryFieldHandler.addListeners", () => {
            const fh = new FormHandler("id");
            fh.addListeners();
            expect(ExpiryFieldHandler.addListeners.calledOnce).to.be.true;
        });
        it("calls DownloadPasswordFieldHandler.addListeners", () => {
            const fh = new FormHandler("id");
            fh.addListeners();
            expect(DownloadPasswordFieldHandler.addListeners.calledOnce).to.be.true;
        });
    });
    describe('copyAllInputs', () => {
        beforeEach(() => {
            const elements = [];
            elements.push(make_element("text", "text", "text"));
            elements.push(make_element("number", "number", 42));
            elements.push(make_element("checkbox", "checked", null, true));
            elements.push(make_element("checkbox", "unchecked", null, false));
            elements.push(make_element("radio", "radio", null, true));
            elements.push(make_element("radio", "notradio", null, false));
            sinon.stub(document, "querySelectorAll").returns(elements);

            function make_element(type, id, value, checked) {
                const element = document.createElement("input");
                element.setAttribute("type", type);
                element.setAttribute("id", `input_${id}`);
                if (value) element.setAttribute("value", value);
                if (checked) element.setAttribute("checked", "");
                return element;
            }
        });
        afterEach(() => {
            document.querySelectorAll().forEach(element => element.remove());
            sinon.restore();
        });
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("copyAllInputs");
            expect(FormHandler).to.respondTo("copyAllInputs");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.copyAllInputs()).not.to.be.a("Promise");
        });
        it("copies string inputs to string properties of the same name", () => {
            const fh = new FormHandler("id");
            fh.copyAllInputs();
            expect(fh.input_text).to.equal("text");
        });
        it("copies number inputs to number properties of the same name", () => {
            const fh = new FormHandler("id");
            fh.copyAllInputs();
            expect(fh.input_number).to.equal("42");
        });
        it("copies checkbox inputs to boolean properties of the same name", () => {
            const fh = new FormHandler("id");
            fh.copyAllInputs();
            expect(fh.input_checked).to.be.true;
            expect(fh.input_unchecked).to.be.false;
        });
        it("copies radio inputs to boolean properties of the same name", () => {
            const fh = new FormHandler("id");
            fh.copyAllInputs();
            expect(fh.input_radio).to.be.true;
            expect(fh.input_notradio).to.be.false;
        });
    });
    describe('fillAllInputs', () => {
        beforeEach(() => {
            const elements = [];
            elements.push(make_element("text", "text"));
            elements.push(make_element("number", "number"));
            elements.push(make_element("checkbox", "checked"));
            elements.push(make_element("checkbox", "unchecked"));
            elements.push(make_element("radio", "radio"));
            elements.push(make_element("radio", "offradio"));
            elements.push(make_element("text", "nottext"));
            elements.push(make_element("checkbox", "notcheck"));
            elements.push(make_element("radio", "notradio"));
            sinon.stub(document, "querySelectorAll").returns(elements);

            function make_element(type, id) {
                const element = document.createElement("input");
                element.setAttribute("type", type);
                element.setAttribute("id", id);
                return element;
            }
        });
        afterEach(() => {
            document.querySelectorAll().forEach(element => element.remove());
            sinon.restore();
        });

        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("fillAllInputs");
            expect(FormHandler).to.respondTo("fillAllInputs");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.fillAllInputs()).not.to.be.a("Promise");
        });
        it("copies string properties to string inputs of the same name", () => {
            const fh = new FormHandler("id");
            fh.text = "text";
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "text").value).to.equal("text");
        });
        it("copies number properties to number inputs of the same name", () => {
            const fh = new FormHandler("id");
            fh.number = 42;
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "number").value).to.equal("42");
        });
        it("copies boolean properties to checkbox inputs of the same name", () => {
            const fh = new FormHandler("id");
            fh.checked = true;
            fh.unchecked = false;
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "checked").checked).to.be.true;
            expect(document.querySelectorAll().find(e => e.id === "unchecked").checked).to.be.false;
        });
        it("copies boolean properties to radio inputs of the same name", () => {
            const fh = new FormHandler("id");
            fh.radio = true;
            fh.offradio = false;
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "radio").checked).to.be.true;
            expect(document.querySelectorAll().find(e => e.id === "offradio").checked).to.be.false;
        });
        it("sets string inputs to the empty string if a property of the same name doesn't exist", () => {
            const fh = new FormHandler("id");
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "nottext").value).to.equal("");
        });
        it("sets checkbox inputs to unchecked if a property of the same name doesn't exist", () => {
            const fh = new FormHandler("id");
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "notcheck").checked).to.be.false;
        });
        it("sets radio inputs to unchecked if a property of the same name doesn't exist", () => {
            const fh = new FormHandler("id");
            fh.fillAllInputs();
            expect(document.querySelectorAll().find(e => e.id === "notradio").checked).to.be.false;
        });
    });
    describe('fillData', () => {
        beforeEach(() => {
            sinon.stub(FormHandler.prototype, "fillAllInputs");
            sinon.stub(ExpiryFieldHandler, "fillData");
            sinon.stub(DownloadPasswordFieldHandler, "fillData");

        });
        afterEach(sinon.restore);
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("fillData");
            expect(FormHandler).to.respondTo("fillData");
        });
        it("is an async method", () => {
            const fh = new FormHandler("id");
            const p = fh.fillData();
            expect(p).to.be.a("Promise");
            return p;
        });
        it("calls fillAllInputs", async () => {
            const fh = new FormHandler("id");
            await fh.fillData();
            expect(FormHandler.prototype.fillAllInputs.calledOnce).to.be.true;
        });
        it("calls ExpiryFieldHandler.fillData", async () => {
            const fh = new FormHandler("id");
            await fh.fillData();
            expect(ExpiryFieldHandler.fillData.calledOnce).to.be.true;
        });
        it("calls DownloadPasswordFieldHandler.fillData", async () => {
            const fh = new FormHandler("id");
            await fh.fillData();
            expect(DownloadPasswordFieldHandler.fillData.calledOnce).to.be.true;
        });

    });
    describe('updateHeader', () => {
        beforeEach(() => {
            sinon.stub(HeaderHandler, "updateFreespace");
            sinon.stub(HeaderHandler, "updateCloudVersion");
        });
        afterEach(sinon.restore);
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("updateHeader");
            expect(FormHandler).to.respondTo("updateHeader");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.updateHeader()).not.to.be.a("Promise");
        });
        it("calls HeaderHandler.updateFreespace", () => {
            const fh = new FormHandler("id");
            fh.updateHeader();
            expect(HeaderHandler.updateFreespace.calledOnce).to.be.true;
        });
        it("calls HeaderHandler.updateCloudVersion", () => {
            const fh = new FormHandler("id");
            fh.updateHeader();
            expect(HeaderHandler.updateCloudVersion.calledOnce).to.be.true;
        });

    });
    describe('preCloudUpdate', () => {
        beforeEach(() => {
            sinon.stub(AccountFieldHandler, "preCloudUpdate");
            sinon.stub(FolderFieldHandler, "preCloudUpdate");
            const value = {};
            value.trim = sinon.fake.returns(value);
            sinon.stub(document, "querySelectorAll").returns([{ value },]);
        });
        afterEach(sinon.restore);
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("preCloudUpdate");
            expect(FormHandler).to.respondTo("preCloudUpdate");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.preCloudUpdate()).not.to.be.a("Promise");
        });
        it("calls AccountFieldHandler.preCloudUpdate", () => {
            const fh = new FormHandler("id");
            fh.preCloudUpdate();
            expect(AccountFieldHandler.preCloudUpdate.calledOnce).to.be.true;
        });
        it("calls FolderFieldHandler.preCloudUpdate", () => {
            const fh = new FormHandler("id");
            fh.preCloudUpdate();
            expect(FolderFieldHandler.preCloudUpdate.calledOnce).to.be.true;
        });
        it("trims all inputs", () => {
            const fh = new FormHandler("id");
            fh.preCloudUpdate();
            expect(document.querySelectorAll()[0].value.trim.calledOnce).to.be.true;
        });
    });
    describe('postCloudUpdate', () => {
        beforeEach(() => {
            sinon.stub(Popup, "warn");
            sinon.stub(AccountFieldHandler, "postCloudUpdate");
            sinon.stub(DownloadPasswordFieldHandler, "postCloudUpdate");
        });
        afterEach(sinon.restore);
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("postCloudUpdate");
            expect(FormHandler).to.respondTo("postCloudUpdate");
        });
        it("returns a Promise", () => {
            const fh = new FormHandler("id");
            expect(fh.postCloudUpdate()).to.be.a("Promise");
        });
        it("warns if public_shares_enabled is undefined", async () => {
            const fh = new FormHandler("id");
            await fh.postCloudUpdate();
            expect(Popup.warn.calledOnce).to.be.true;
            expect(Popup.warn.lastCall.firstArg).to.equal("no_config_check");
        });
        it("doesn't warn if public_shares_enabled is defined", async () => {
            const fh = new FormHandler("id");
            fh.public_shares_enabled = false;
            await fh.postCloudUpdate();
            expect(Popup.warn.called).to.be.false;
        });
        it("calls AccountFieldHandler.postCloudUpdate", async () => {
            const fh = new FormHandler("id");
            await fh.postCloudUpdate();
            expect(AccountFieldHandler.postCloudUpdate.calledOnce).to.be.true;
        });
        it("calls DownloadPasswordFieldHandler.postCloudUpdate", async () => {
            const fh = new FormHandler("id");
            await fh.postCloudUpdate();
            expect(DownloadPasswordFieldHandler.postCloudUpdate.calledOnce).to.be.true;
        });
    });
    describe('showErrors', () => {
        beforeEach(() => {
            sinon.stub(Popup, "error");
            sinon.stub(Popup, "warn");
        });
        afterEach(sinon.restore);
        it("is not a static method", () => {
            expect(FormHandler).itself.not.to.respondTo("showErrors");
            expect(FormHandler).to.respondTo("showErrors");
        });
        it("is not an async method", () => {
            const fh = new FormHandler("id");
            expect(fh.showErrors()).not.to.be.a("Promise");
        });
        it("shows an error if public_shares_enabled is false", () => {
            const fh = new FormHandler("id");
            fh.public_shares_enabled = false;
            fh.showErrors();
            expect(Popup.error.calledOnce).to.be.true;
            expect(Popup.error.lastCall.firstArg).to.equal("sharing_off");
        });
        it("doesn't show an error if public_shares_enabled is true", () => {
            const fh = new FormHandler("id");
            fh.public_shares_enabled = true;
            fh.showErrors();
            expect(Popup.error.called).to.be.false;
        });
        it("shows a warning if cloud_supported is false", () => {
            const fh = new FormHandler("id");
            fh.cloud_supported = false;
            fh.showErrors();
            expect(Popup.warn.calledOnce).to.be.true;
            expect(Popup.warn.lastCall.firstArg).to.equal("unsupported_cloud");
        });
        it("doesn't show a warning if cloud_supported is true", () => {
            const fh = new FormHandler("id");
            fh.public_shares_enabled = false;
            fh.showErrors();
            expect(Popup.warn.called).to.be.false;
        });
    });
    describe('lookBusy', () => {
        beforeEach(() => {
            const all_fields = document.createElement("fieldset");
            sinon.stub(document, "querySelector").returns(all_fields);
        });
        afterEach(() => {
            document.body.classList.remove('busy');
            sinon.restore();
        });
        it("is a static method", () => {
            expect(FormHandler).itself.to.respondTo("lookBusy");
        });
        it("is not an async method", () => {
            expect(FormHandler.lookBusy()).not.to.be.a("Promise");
        });
        it("disables the all_inputs fieldset", () => {
            FormHandler.lookBusy();
            expect(document.querySelector().disabled).to.be.true;
        });
        it("adds busy to the body's class list", () => {
            FormHandler.lookBusy();
            expect(document.body.classList.contains("busy")).to.be.true;
        });
    });
    describe('stopLookingBusy', () => {
        beforeEach(() => {
            const all_fields = document.createElement("fieldset");
            sinon.stub(document, "querySelector").returns(all_fields);
            document.body.classList.add('busy');
        });
        afterEach(sinon.restore);

        it("is a static method", () => {
            expect(FormHandler).itself.to.respondTo("stopLookingBusy");
        });
        it("is not an async method", () => {
            expect(FormHandler.stopLookingBusy()).not.to.be.a("Promise");
        });
        it("enables the all_inputs fieldset", () => {
            FormHandler.stopLookingBusy();
            expect(document.querySelector().disabled).to.be.false;
        });
        it("removes busy from the body's class list", () => {
            FormHandler.stopLookingBusy();
            expect(document.body.classList.contains("busy")).to.be.false;
        });
    });
});
