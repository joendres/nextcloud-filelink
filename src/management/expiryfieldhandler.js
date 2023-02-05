// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

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
     * Fill in data from the CloudAccount object that is not yet handled
     * @param {CloudAccount} account The CloudAccount linked to the open dialog
     */
    static fillData(account) {
        /** @type {HTMLInputElement} */
        const expiryDays = document.querySelector("#expiryDays");
        /** @type {HTMLInputElement} */
        const useExpiry = document.querySelector("#useExpiry");

        if (account.expiry_max_days) {
            expiryDays.max = account.expiry_max_days;
            /** @todo this is plain wrong */
            account.expiryDays = useExpiry.checked ? Math.min(expiryDays.value, account.expiry_max_days) : account.expiry_max_days;
            expiryDays.value = account.expiryDays;
            useExpiry.checked = true;
            useExpiry.disabled = true;
        } else {
            expiryDays.removeAttribute('max');
            useExpiry.disabled = false;
        }
        ExpiryFieldHandler.syncInputStateToCheck();
    }
}
