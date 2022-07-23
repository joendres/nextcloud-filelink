import { Localize } from "../lib/localize.js";
import { FormHandler } from "./formhandler.js";

(async () => {
    Localize.addLocalizedLabels();

    const formHandler = new FormHandler(new URL(location.href).searchParams.get("accountId"));
    formHandler.addListeners();
    await formHandler.fillData();
    formHandler.showErrors();
    formHandler.updateHeader();
})();