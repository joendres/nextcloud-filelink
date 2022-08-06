import { HeaderHandler } from "./headerhandler.js";
import { CloudConnection } from "../common/cloudconnection.js";
import { AccountFieldHandler } from "./accountfieldhandler.js";
import { DownloadPasswordFieldHandler } from "./dowloadpasswordfieldhandler.js";
import { ExpiryFieldHandler } from "./expiryfieldhandler.js";
import { FolderFieldHandler } from "./folderfieldhandler.js";
import { Popup } from "./popup/popup.js";

export class FormHandler {
    /**
     * @param {string} accountId The id of the account as supplied by TB
     */
    constructor(accountId) {
        this.cc = new CloudConnection(accountId);
    }

    /**
     * Add event listeners to all elements that need them
     */
    addListeners() {
        /** @type {HTMLFormElement} */
        const accountForm = document.querySelector("#accountForm");

        accountForm.oninput = FormHandler.updateButtons;
        accountForm.onreset = () => this.resetHandler();
        // THE submit HANDLER MUST NOT BE async (Learned the hard way)
        accountForm.onsubmit = event => {
            this.submitHandler();
            event.preventDefault();
        };

        ExpiryFieldHandler.addListeners();
        DownloadPasswordFieldHandler.addListeners();
    }

    /**
     * Get data from a stored account and put it into the form
     */
    async fillData() {
        await this.cc.load();
        this.fillAllInputs();
        ExpiryFieldHandler.fillData(this.cc);
        DownloadPasswordFieldHandler.fillData(this.cc);
    }

    /**
     * Save button is only active if field values validate OK
     * Reset button is only active if any field has been changed
     */
    static updateButtons() {
        /** @type {HTMLButtonElement} */
        const saveButton = document.querySelector("#saveButton");
        /** @type {HTMLButtonElement} */
        const resetButton = document.querySelector("#resetButton");
        /** @type {HTMLFormElement} */
        const accountForm = document.querySelector("#accountForm");

        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }

    /**
     * Handle reset events AKA reset button pressed
     */
    resetHandler() {
        /** @type {HTMLButtonElement} */
        const saveButton = document.querySelector("#saveButton");
        /** @type {HTMLButtonElement} */
        const resetButton = document.querySelector("#resetButton");

        Popup.clear();
        this.fillData();
        resetButton.disabled = saveButton.disabled = true;
    }

    /**
     * Handle submit event AKA save button pressed
     */
    async submitHandler() {
        /** @type {HTMLButtonElement} */
        const saveButton = document.querySelector("#saveButton");
        /** @type {HTMLButtonElement} */
        const resetButton = document.querySelector("#resetButton");

        FormHandler.lookBusy();
        saveButton.disabled = resetButton.disabled = true;
        Popup.clear();

        const persist = this.preCloudUpdate();
        this.copyAllInputs();
        await this.cc.updateFromCloud();
        await this.postCloudUpdate(persist);
        await this.cc.store();
        await Promise.all([
            this.cc.updateConfigured(),
            this.fillData(),
            this.updateHeader(),
            this.showErrors(),
        ]);

        if (Popup.empty()) {
            Popup.success();
        }
        FormHandler.stopLookingBusy();
    }

    /**
     * Set the busy cursor and deactivate all inputs
     */
    static lookBusy() {
        document.querySelector("body").classList.add('busy');
        /** @type {HTMLFieldSetElement} */
        const all_fields = document.querySelector("#all_fields");
        all_fields.disabled = true;
    }

    /**
     * Hide the busy cursor and reactivate all fields that were active
     */
    static stopLookingBusy() {
        /** @type {HTMLFieldSetElement} */
        const all_fields = document.querySelector("#all_fields");
        all_fields.disabled = false;
        document.querySelector("body").classList.remove('busy');
    }

    /**
     * Fill standard inputs with the data of the same id
     */
    fillAllInputs() {
        /** @type {HTMLInputElement} */
        document.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    input.checked = !!this.cc[input.id];
                } else if (this.cc[input.id]) {
                    input.value = this.cc[input.id];
                }
            });
    }

    /**
     * Prepare everything for harvesting the data from the form and for getting
     * additional data from the cloud, eg sanitize inputs
     * @returns Data that will be reused in the postCloudUpdate call later
     */
    preCloudUpdate() {
        /** @type {HTMLInputElement} */
        document.querySelectorAll("input")
            .forEach(element => {
                element.value = element.value.trim();
            });

        const persist = {};
        persist.account = AccountFieldHandler.preCloudUpdate(this.cc);
        FolderFieldHandler.preCloudUpdate();
        return persist;
    }

    /**
     * Do whatever is necessary after the CloudConnection state is update from the cloud
     * @param {*} persist Data returned from preCloudUpdate earlier
     */
    async postCloudUpdate(persist) {
        if ('undefined' === typeof this.cc.public_shares_enabled) {
            Popup.warn('no_config_check');
        }
        return Promise.all([
            AccountFieldHandler.postCloudUpdate(this.cc, persist.account),
            DownloadPasswordFieldHandler.postCloudUpdate(this.cc),
        ]);
    }

    /**
     * Copy data into the connection object
     */
    copyAllInputs() {
        /** @type {HTMLInputElement} */
        document.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    this.cc[input.id] = input.checked;
                }
                else {
                    this.cc[input.id] = input.value;
                }
            });
    }

    /**
     * Show general errors
     */
    showErrors() {
        if (this.cc.laststatus) {
            Popup.error(this.cc.laststatus);
        } else if (false === this.cc.public_shares_enabled) {
            Popup.error('sharing_off');
        } else if (false === this.cc.cloud_supported) {
            Popup.warn('unsupported_cloud');
        }
    }

    /**
     * Update the content of the page header
     */
    updateHeader() {
        HeaderHandler.updateFreespace(this.cc);
        HeaderHandler.updateCloudVersion(this.cc);
    }
}