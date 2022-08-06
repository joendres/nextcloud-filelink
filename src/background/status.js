/**
 * Global Map to hold Status objects for all active uploads, indexed by the
 * uploadId
 * @type {Map<string,UploadStatus>}
 */
const attachmentStatus = new Map();

class Status {
    static setup() {
        if (!browser.runtime.onConnect.hasListener(Status.connectHandler)) {
            browser.runtime.onConnect.addListener(Status.connectHandler);
        }
    }

    /**
     * Update badge and send status to status popup, if it's listening (open)
     */
    static async update() {
        const messages = attachmentStatus.size.toString();
        messenger.composeAction.setBadgeText({ text: messages !== "0" ? messages : null, });
        if (Status.port) {
            Status.port.postMessage(attachmentStatus);
        }
    }

    /**
     * Remove one upload from the status map
     * @param {string} uploadId The id of the upload created in background.js
     */
    static async remove(uploadId) {
        attachmentStatus.delete(uploadId);
        Status.update();
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
}

class MsgHandler {
    /**
     * Dispatch a command received as a message to the method of the same name
     * @param {string} msg The command as received as a message
     */
    static dispatch(msg) {
        // Check if it's defined within this class as a static method
        if ('function' === typeof MsgHandler[msg]) {
            MsgHandler[msg]();
        } else {
            throw ReferenceError('No handler for ' + msg);
        }
    }

    /**
     * Remove all Status objects from attachmentStatus that are in error state
     */
    static clearcomplete() {
        attachmentStatus.forEach(
            (v, k, m) => {
                if (true === v.error || 'generatedpassword' === v.status) {
                    m.delete(k);
                }
            });
        Status.update();
    }

    static sendstatus() {
        Status.update();
    }
}

Status.setup();

export { Status, attachmentStatus };
