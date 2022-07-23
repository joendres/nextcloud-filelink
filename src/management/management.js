import { Localize } from "../lib/localize.js";
import { FormHandler } from "./formhandler.js";

Localize.addLocalizedLabels();

const formHandler = new FormHandler(new URL(location.href).searchParams.get("accountId"));
formHandler.fillData();
formHandler.addListeners();
