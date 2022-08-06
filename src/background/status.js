import { UploadStatus } from "./uploadstatus.js";

export class Status {
    static setup() {
        if (!browser.runtime.onConnect.hasListener(Status.connectHandler)) {
            browser.runtime.onConnect.addListener(Status.connectHandler);
        }
        if (!Status.attachmentStatus) {
            Status.attachmentStatus = new Map();
        }
    }

    static add(uploadId, fileName) {
        Status.attachmentStatus.set(uploadId, new UploadStatus(fileName));
    }

    /**
     * Set new status, possible values defined in _locales and progress.js
     * @param {string} uploadId The id of the upload that changed its status
     * @param {string} s The new status
     */
    static set_status(uploadId, s) {
        Status.attachmentStatus.get(uploadId).status = s;
        Status.update();
    }

    /**
     * Set the upload status to error state
     * @param {string} uploadId The id of the upload that changed its status
     */
    static fail(uploadId) {
        Status.attachmentStatus.get(uploadId).error = true;
        Status.update();
    }

    /**
     * Update the upload progress
     * @param {number} p Fraction of data already transferred as a float
     * @param {string} uploadId The id of the upload that changed its status
     */
    static set_progress(uploadId, p) {
        Status.attachmentStatus.get(uploadId).progress = p;
        Status.update();
    }

    static set_password(uploadId, pw) {
        Status.attachmentStatus.get(uploadId).password = pw;
        Status.update();
    }

    static done(uploadId) {
        const upload = Status.attachmentStatus.get(uploadId);
        if (true !== upload.error && 'generatedpassword' !== upload.status) {
            Status.remove(uploadId);
        }
    }

    /**
     * Update badge and send status to status popup, if it's listening (open)
     */
    static async update() {
        const messages = Status.attachmentStatus.size.toString();
        messenger.composeAction.setBadgeText({ text: messages !== "0" ? messages : null, });
        if (Status.port) {
            Status.port.postMessage(Status.attachmentStatus);
        }
    }

    /**
     * Remove one upload from the status map
     * @param {string} uploadId The id of the upload created in background.js
     */
    static async remove(uploadId) {
        Status.attachmentStatus.delete(uploadId);
        Status.update();
    }

    static clearcomplete() {
        Status.attachmentStatus.forEach(
            (v, k, m) => {
                if (true === v.error || 'generatedpassword' === v.status) {
                    m.delete(k);
                }
            });
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

Status.setup();
