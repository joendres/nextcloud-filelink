// Copyright (C) 2020 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { Account } from "../lib/account.js";
import { CloudCapabilities } from "../lib/cloudcapabilities.js";
import { makeSubmitHandler } from "./submitHandler.js";
import { makeResetHandler } from "./resethandler.js";
import { changeHandler } from "./changehandler.js";
import { updateForm } from "./updateform.js";
import { inputHandler } from "./updateelementstates.js";
import { FreeSpaceDisplay } from "./freespacedisplay.js";

(async () => {
    const accountId = new URL(location.href).searchParams.get("accountId");

    // We will need the current values of the account and the capabilities
    const [account, capabilities,] = await Promise.all([
        Account.get(accountId),
        CloudCapabilities.get(accountId),
    ]);

    FreeSpaceDisplay.updateFromCloud(account, capabilities);

    // Prefill the form and adjust what is necessary
    updateForm(account, capabilities);

    // Add event handlers
    const accountForm = document.getElementById('accountForm');

    // The user typed a character or clicked something, allow to save if
    // the data is valid
    accountForm.addEventListener("input", inputHandler);

    // The user changed the formdata, change the appearance of the form
    // according to the change
    accountForm.addEventListener("change", changeHandler);

    // The user submitted the form, by clicking Save or pressing Enter
    accountForm.addEventListener("submit", makeSubmitHandler(account, capabilities));

    // The user clicked the Cancel button, restore saved values
    accountForm.addEventListener("reset", makeResetHandler(account, capabilities));
})();