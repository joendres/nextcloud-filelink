import { Localize } from "../lib/localize.js";
import { FormHandler } from "./formhandler.js";

console.debug("Dialog added");

Localize.addLocalizedLabels();

const formHandler = new FormHandler(new URL(location.href).searchParams.get("accountId"));
formHandler.fillData();
formHandler.addListeners();