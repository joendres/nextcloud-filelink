class FormStateHandler {
    static addAllListeners() {
        FormStateHandler.linkElementStateToCheckbox(expiryDays, useExpiry);
        accountForm.addEventListener('input', FormStateHandler.updateButtons);
        document.getElementsByName("DLPRadio")
            .forEach(inp => inp.addEventListener("change", FormStateHandler.handleDLRadioChange));
    }

    /**
     *  enable/disable text input field according to checkbox state
     */
    static linkElementStateToCheckbox(element, checkbox) {
        checkbox.addEventListener("input", () => {
            element.disabled = !checkbox.checked;
            element.required = !element.disabled;
        });
    }

    /**
    * Set the busy cursor and deactivate all inputs
    */
    static lookBusy() {
        document.querySelector("body").classList.add('busy');
        disableable_fieldset.disabled = true;
    }

    /**
     * Hide the busy cursor and reactivate all fields that were active
     */
    static stopLookingBusy() {
        disableable_fieldset.disabled = false;
        document.querySelector("body").classList.remove('busy');
    }

    /**
     * Update states of the DL-elements and the buttons
     */
    static handleDLRadioChange() {
        FormStateHandler.adjustDLPasswordElementStates();
        FormStateHandler.updateButtons();
    }

    /** 
     * Set attributes of DL password field and copy state to hidden config variable
     */
    static adjustDLPasswordElementStates() {
        downloadPassword.disabled = !oneDLPassword.checked;
        downloadPassword.required = oneDLPassword.checked;
        useDlPassword.checked = oneDLPassword.checked || useGeneratedDlPassword.checked;
    }

    /**
     * Save button is only active if field values validate OK
     * Reset button is only active if any field has been changed
     */
    static updateButtons() {
        saveButton.disabled = !accountForm.checkValidity();
        resetButton.disabled = false;
    }
}

/* exported FormStateHandler */
// Defined in management.html as element id
/* globals disableable_fieldset */
/* globals downloadPassword, oneDLPassword, useGeneratedDlPassword, useDlPassword */
/* globals saveButton, resetButton, accountForm */
/* globals expiryDays, useExpiry */