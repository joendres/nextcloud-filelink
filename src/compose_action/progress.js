import { Localize } from "../common/localize.js";
import { StatusDisplay } from "./statusdisplay.js";

/** Establish messaging with background worker
 * @type {browser.runtime.Port} */
const port = browser.runtime.connect();
port.onMessage.addListener(StatusDisplay.update);
port.postMessage("update");

Localize.addLocalizedLabels();

// Unsuccessful uploads remain in the popup window until this button is pressed
/** @type {HTMLButtonElement} */
const button_clear = document.querySelector("#button_clear");
button_clear.addEventListener('click', () => port.postMessage('clearcomplete'));
