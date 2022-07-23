import { CloudConnection } from "../lib/cloudconnection.js";
import { Popup } from "./popup/popup.js";

export class FormHandler {
    constructor(accountId) {
        this.cc = new CloudConnection(accountId);
    }

    /**
     * Add event listeners to all elements that need them
     */
    addListeners() {
        accountForm.oninput = FormHandler.updateButtons;
        accountForm.onreset = () => this.resetHandler();
        accountForm.onsubmit = (evt) => this.submitHandler(evt);
    }

    /**
     * Get data from a stored account and put it into the form
     */
    async fillData() {
        await this.cc.load();
        this.fillAllInputs();
    }

    /**
     * Save button is only active if field values validate OK
     * Reset button is only active if any field has been changed
     */
    static updateButtons() {
        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }

    /**
     * Handle reset events AKA reset button pressed
     */
    resetHandler() {
        Popup.clear();
        this.fillData();
        resetButton.disabled = saveButton.disabled = true;
    }

    /**
     * Handle submit event AKA save button pressed
     * @param {Event} evt The button press event
     */
    async submitHandler(evt) {
        FormHandler.lookBusy();
        saveButton.disabled = resetButton.disabled = true;
        Popup.clear();
        // @todo handle inputs
        this.copyAllInputs();
        await this.cc.store();
        this.fillData();
        FormHandler.stopLookingBusy();
        evt.preventDefault();
    }

    /**
     * Set the busy cursor and deactivate all inputs
     */
    static lookBusy() {
        body.classList.add('busy');
        all_fields.disabled = true;
    }

    /**
     * Hide the busy cursor and reactivate all fields that were active
     */
    static stopLookingBusy() {
        all_fields.disabled = false;
        body.classList.remove('busy');
    }

    /**
     * Fill standard inputs with the data of the same id
     */
    fillAllInputs() {
        accountForm.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    input.checked = !!this.cc[input.id];
                } else if (this.cc[input.id]) {
                    input.value = this.cc[input.id];
                }
            });
    }

    /**
     * Copy data into the connection object
     */
    copyAllInputs() {
        accountForm.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    this.cc[input.id] = input.checked;
                }
                else {
                    this.cc[input.id] = input.value;
                }
            });
    }

}

// html ids are automatic vairables
/* globals accountForm, saveButton, resetButton, all_fields, body */
