import { Localize } from "../common/localize.js";
import { FormHandler } from "./formhandler.js";

export async function run() {
    Localize.addLocalizedLabels();

    const accountId = new URL(location.href).searchParams.get("accountId");
    const formHandler = new FormHandler(accountId);
    formHandler.addListeners();
    await formHandler.fillData();
    formHandler.showErrors();
    formHandler.updateHeader();
}

run();