import { StatusDisplay } from "./statusdisplay.js";

export class ComPort {
    static setup() {
        // Establish messaging with background worker
        /** @type {browser.runtime.Port} */
        ComPort.port = browser.runtime.connect();
        // Set the handler for the messages sent in Status.update()
        ComPort.port.onMessage.addListener(StatusDisplay.update);
        ComPort.port.postMessage("update");

        // Unsuccessful uploads remain in the popup window until this button is pressed
        /** @type {HTMLButtonElement} */
        const button_clear = document.querySelector("#button_clear");
        button_clear.onclick = ComPort.clearButtonHandler;
    }

    static clearButtonHandler() {
        ComPort.port.postMessage("clearcomplete");
    }
}
