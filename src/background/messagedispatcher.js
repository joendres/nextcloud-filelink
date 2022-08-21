import { Status } from "./status.js";

export class MessageDispatcher {
    static installHandler() {
        if (!browser.runtime.onConnect.hasListener(MessageDispatcher.connectHandler)) {
            browser.runtime.onConnect.addListener(MessageDispatcher.connectHandler);
        }
    }

    /**
     * Handle the browser.runtime.onConnect event
     * @param {browser.runtime.Port} p The Port object for the connection
     */
    static connectHandler(p) {
        Status.port = p;
        Status.port.onDisconnect.addListener(MessageDispatcher.closePort);
        Status.port.onMessage.addListener(MessageDispatcher.dispatch);
    }

    /**
     * Close the communication port
     */
    static closePort() {
        Status.port = null;
    }

    /**
     * Dispatch a command received as a message to the method of the same name
     * @param {string} msg The command as received as a message
     */
    static dispatch(msg) {
        const legal_calls = ["update", "clearcomplete",];

        if (legal_calls.includes(msg)) {
            Status[msg]();
        } else {
            throw ReferenceError('No handler for ' + msg);
        }
    }
}
