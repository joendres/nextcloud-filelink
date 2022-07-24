/**
 * Handle the input fields in the expiry_fields fieldset
 */
export class ExpiryFieldHandler {

    /**
     * Add event listeners to the form elements
     */
    static addListeners() {
        /** @type {HTMLInputElement} */
        const useExpiry = document.querySelector("#useExpiry");
        useExpiry.oninput = ExpiryFieldHandler.syncInputStateToCheck;
    }

    /**
     * Set state of number input field to state of checkbox
     */
    static syncInputStateToCheck() {
        /** @type {HTMLInputElement} */
        const expiryDays = document.querySelector("#expiryDays");
        /** @type {HTMLInputElement} */
        const useExpiry = document.querySelector("#useExpiry");
        expiryDays.disabled = !useExpiry.checked;
        expiryDays.required = useExpiry.checked;
    }
    /**
     * Fill in data from the cloudConnection object that is not yet handled
     * @param {CloudConnection} cc The cloudConnection linked to the open dialog
     */
    static fillData(cc) {
        /** @type {HTMLInputElement} */
        const expiryDays = document.querySelector("#expiryDays");
        /** @type {HTMLInputElement} */
        const useExpiry = document.querySelector("#useExpiry");

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
