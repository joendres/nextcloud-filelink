// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Localize } from "../common/localize.js";
import { FormHandler } from "./formhandler.js";

Localize.addLocalizedLabels();

const accountId = new URL(location.href).searchParams.get("accountId");
const formHandler = new FormHandler(accountId);
formHandler.addListeners();
formHandler.fillData().then(() => {
    formHandler.showErrors();
    formHandler.updateHeader();
});
