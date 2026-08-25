// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { CloudCapabilities } from "../lib/cloudcapabilities.js";
import { FreeSpaceDisplay } from "./freespacedisplay.js";
import { showVersion } from "./header.js";
import { inputHandler, updateElementStates } from "./updateelementstates.js";

/**
 * Update the header and the form considering which inputs were changed
 * @param {Event} event 
 */
function changeHandler(event) {
    switch (event.target.id) {
        case "serverUrl":
            // We don't know anything about the cloud so show the defaults
            showVersion(new CloudCapabilities(), document.getElementById("serverUrl").value);
            FreeSpaceDisplay.hide();
            break;
        case "username":
            // The per user quota might be different
            FreeSpaceDisplay.hide();
            break;
    }
    // disabled state of some inputs is dependent on other input's states
    updateElementStates();
    inputHandler();
}

export { changeHandler }