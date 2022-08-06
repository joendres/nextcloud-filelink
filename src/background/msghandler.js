import { Status } from "./status.js";

export class MsgHandler {
    static installHandler() {
        if (!browser.runtime.onConnect.hasListener(MsgHandler.connectHandler)) {
            browser.runtime.onConnect.addListener(MsgHandler.connectHandler);
        }
    }

    /**
     * Handle the browser.runtime.onConnect event
     * @param {browser.runtime.Port} p The Port object for the connection
     */
    static connectHandler(p) {
        Status.port = p;
        Status.port.onDisconnect.addListener(() => Status.port = null);
        Status.port.onMessage.addListener(MsgHandler.dispatch);
    }

    /**
     * Dispatch a command received as a message to the method of the same name
     * @param {string} msg The command as received as a message
     */
    static dispatch(msg) {
        // Check if it's defined within this class as a static method
        if (msg.match(/^\w+$/) &&
            msg !== "dispatch" &&
            Object.hasOwn(MsgHandler, msg) &&
            "function" === typeof MsgHandler[msg]
        ) {
            MsgHandler[msg]();
        } else {
            throw ReferenceError('No handler for ' + msg);
        }
    }

    /**
     * Remove all Status objects from attachmentStatus that are in error state
     */
    static clearcomplete() {
        Status.clearcomplete();
    }

    /**
     * Send an update
     */
    static sendstatus() {
        Status.update();
    }
}
