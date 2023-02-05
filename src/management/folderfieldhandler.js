// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

/**
 * Handle the input fields in the folder_fields fieldset
 */
export class FolderFieldHandler {
    static preCloudUpdate() {
        /** @type {HTMLInputElement} */
        const storageFolder = document.querySelector("#storageFolder");
        // Remove extra slashes from folder path
        storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');
    }
}
