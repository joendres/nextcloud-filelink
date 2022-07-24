import { HeaderHandler } from "./headerhandler.js";
import { CloudConnection } from "../lib/cloudconnection.js";
import { AccountFieldHandler } from "./accountfieldhandler.js";
import { DownloadPasswordFieldHandler } from "./dowloadpasswordfieldhandler.js";
import { ExpiryFieldHandler } from "./expiryfieldhandler.js";
import { FolderFieldHandler } from "./folderfieldhandler.js";
import { Popup } from "./popup/popup.js";

export class FormHandler {
    constructor(accountId) {
        this.cc = new CloudConnection(accountId);
    }

    /**
     * Add event listeners to all elements that need them
     */
    addListeners() {
        const accountForm = document.querySelector("#accountForm");

        accountForm.oninput = FormHandler.updateButtons;
        accountForm.onreset = () => this.resetHandler();
        accountForm.onsubmit = (evt) => this.submitHandler(evt);

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
        const saveButton = document.querySelector("#saveButton");
        const resetButton = document.querySelector("#resetButton");
        const accountForm = document.querySelector("#accountForm");

        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }

    /**
     * Handle reset events AKA reset button pressed
     */
    resetHandler() {
        const saveButton = document.querySelector("#saveButton");
        const resetButton = document.querySelector("#resetButton");

        Popup.clear();
        this.fillData();
        resetButton.disabled = saveButton.disabled = true;
    }

    /**
     * Handle submit event AKA save button pressed
     * @param {Event} evt The button press event
     */
    async submitHandler(evt) {
        const saveButton = document.querySelector("#saveButton");
        const resetButton = document.querySelector("#resetButton");

        FormHandler.lookBusy();
        saveButton.disabled = resetButton.disabled = true;
        Popup.clear();
        const persist = this.preCloudUpdate();
        this.copyAllInputs();
        await this.cc.updateFromCloud();
        await this.postCloudUpdate(persist);
        this.cc.updateConfigured();
        await this.cc.store();
        this.fillData();
        this.updateHeader();
        this.showErrors();
        if (Popup.empty()) {
            Popup.success();
        }
        FormHandler.stopLookingBusy();
        evt.preventDefault();
    }

    /**
     * Set the busy cursor and deactivate all inputs
     */
    static lookBusy() {
        document.querySelector("body").classList.add('busy');
        document.querySelector("#all_fields").disabled = true;
    }

    /**
     * Hide the busy cursor and reactivate all fields that were active
     */
    static stopLookingBusy() {
        document.querySelector("#all_fields").disabled = false;
        document.querySelector("body").classList.remove('busy');
    }

    /**
     * Fill standard inputs with the data of the same id
     */
    fillAllInputs() {
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

    updateHeader() {
        HeaderHandler.updateFreespace(this.cc._accountId);
        HeaderHandler.updateCloudVersion(this.cc);
    }
}