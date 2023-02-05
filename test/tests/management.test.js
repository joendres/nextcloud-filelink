// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Localize } from "../../src/common/localize.js";
import { FormHandler } from "../../src/management/formhandler.js";
const expect = chai.expect;

describe("management.js", () => {
    before(async () => {
        sinon.stub(FormHandler.prototype, "addListeners");
        sinon.stub(FormHandler.prototype, "fillData").resolves();
        sinon.stub(FormHandler.prototype, "showErrors");
        sinon.stub(FormHandler.prototype, "updateHeader");
        sinon.stub(Localize, "addLocalizedLabels");

        await import("../../src/management/management.js");
    });
    after(sinon.restore);

    it("calls Localize.addLocalizedLabels", async () => {
        expect(Localize.addLocalizedLabels.calledOnce).to.be.true;
    });
    it.skip("creates a new Formhandler", async () => {
        expect.fail("can't spy on constructor?");
    });
    it("calls formHandler.addListeners", async () => {
        expect(FormHandler.prototype.addListeners.calledOnce).to.be.true;
    });
    it("calls await formHandler.fillData", async () => {
        expect(FormHandler.prototype.fillData.calledOnce).to.be.true;
    });
    it("calls formHandler.showErrors", async () => {
        expect(FormHandler.prototype.showErrors.calledOnce).to.be.true;
    });
    it("calls formHandler.updateHeader", async () => {
        expect(FormHandler.prototype.updateHeader.calledOnce).to.be.true;
    });
});
