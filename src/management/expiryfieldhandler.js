/**
 * Handle the input fields in the account_fields fieldset
 */
export class ExpiryFieldHandler {

    /**
     * Add event listeners to the form elements
     */
    static addListeners() {
        useExpiry.oninput = ExpiryFieldHandler.syncInputStateToCheck;
    }

    /**
     * Set state of number input field to state of checkbox
     */
    static syncInputStateToCheck() {
        expiryDays.disabled = !useExpiry.checked;
        expiryDays.required = useExpiry.checked;
    }
    /**
     * Fill in data from the cloudConnection object that is not yet handled
     * @param {CloudConnection} cc The cloudConnection linked to the open dialog
     */
    static fillData(cc) {
        if (cc.expiry_max_days) {
            expiryDays.max = cc.expiry_max_days;
            // @todo this seems wrong. How do we know that expiry is enforced?
            cc.expiryDays = useExpiry.checked ? Math.min(expiryDays.value, cc.expiry_max_days) : cc.expiry_max_days;
            expiryDays.value = cc.expiryDays;
            useExpiry.checked = true;
            useExpiry.disabled = true;
        } else {
            expiryDays.removeAttribute('max');
            useExpiry.disabled = false;
        }
        ExpiryFieldHandler.syncInputStateToCheck();
        // @todo Warn about enforced expiry
    }
}

// html ids are automatic vairables
/* globals expiryDays, useExpiry */