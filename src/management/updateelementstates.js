// Copyright (C) 2026 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Set disabled and required state of elements depending on the relevant checkboxes
 */
function updateElementStates() {
    // Set the download password radio buttons and the hidden "useDlPassword" field
    const useNoDlPassword = document.getElementById("useNoDlPassword");
    const useDlPassword = document.getElementById("useDlPassword");
    const useGeneratedDlPassword = document.getElementById("useGeneratedDlPassword");
    const oneDLPassword = document.getElementById("oneDLPassword");
    useDlPassword.checked = oneDLPassword.checked || useGeneratedDlPassword.checked;
    useNoDlPassword.checked = !useDlPassword.checked;

    // Set the state of the download input field according to the radio button
    // state
    const downloadPassword = document.getElementById("downloadPassword");
    downloadPassword.disabled = !oneDLPassword.checked;
    downloadPassword.required = oneDLPassword.checked;

    // Set the state of the expiry day input field according to the checkbox
    // state
    const expiryDays = document.getElementById("expiryDays");
    const useExpiry = document.getElementById("useExpiry");
    expiryDays.disabled = !useExpiry.checked;
    expiryDays.required = !expiryDays.disabled;
}

/**
 * Activate the Save button only if the form contains valid data
 */
function inputHandler() {
    const accountForm = document.getElementById('accountForm');
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById("resetButton");
    // Enable the Save button if the form contains valid data
    saveButton.disabled = !accountForm.checkValidity();
    resetButton.disabled = false;
}

export { updateElementStates, inputHandler }