import { CloudAccount } from "../common/cloudaccount.js";
import { AccountFieldHandler } from "./accountfieldhandler.js";
import { DownloadPasswordFieldHandler } from "./downloadpasswordfieldhandler.js";
import { ExpiryFieldHandler } from "./expiryfieldhandler.js";
import { FolderFieldHandler } from "./folderfieldhandler.js";
import { HeaderHandler } from "./headerhandler.js";
import { Popup } from "./popup/popup.js";

export class FormHandler extends CloudAccount {
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
        /** @todo move this out of the function */
        await this.load();
        this.fillAllInputs();
        ExpiryFieldHandler.fillData(this);
        DownloadPasswordFieldHandler.fillData(this);
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
        /** @todo The header might need an update too? */
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

        this.preCloudUpdate();
        this.copyAllInputs();
        await this.updateFromCloud();
        await this.postCloudUpdate();
        await this.store();
        await Promise.all([
            this.updateConfigured(),
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
        document.body.classList.add('busy');
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
        document.body.classList.remove('busy');
    }

    /**
     * Fill standard inputs with the data of the same id
     */
    fillAllInputs() {
        /** @type {HTMLInputElement} */
        document.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    input.checked = !!this[input.id];
                } else if (this[input.id]) {
                    input.value = this[input.id];
                }
            });
    }

    /**
     * Prepare everything for harvesting the data from the form and for getting
     * additional data from the cloud, eg sanitize inputs
     */
    preCloudUpdate() {
        /** @type {HTMLInputElement} */
        document.querySelectorAll("input")
            .forEach(element => {
                element.value = element.value.trim();
            });

        AccountFieldHandler.preCloudUpdate();
        FolderFieldHandler.preCloudUpdate();
    }

    /**
     * Do whatever is necessary after the CloudAccount state is updated from the cloud
     */
    postCloudUpdate() {
        if ('undefined' === typeof this.public_shares_enabled) {
            Popup.warn('no_config_check');
        }
        return Promise.all([
            AccountFieldHandler.postCloudUpdate(this),
            DownloadPasswordFieldHandler.postCloudUpdate(this),
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
                    this[input.id] = input.checked;
                }
                else {
                    this[input.id] = input.value;
                }
            });
    }

    /**
     * Show general errors
     */
    showErrors() {
        if (false === this.public_shares_enabled) {
            Popup.error('sharing_off');
        } else if (false === this.cloud_supported) {
            Popup.warn('unsupported_cloud');
        }
    }

    /**
     * Update the content of the page header
     */
    updateHeader() {
        HeaderHandler.updateFreespace(this);
        HeaderHandler.updateCloudVersion(this);
    }
}