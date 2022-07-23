/**
 * Handle the input fields in the folder_fields fieldset
 */
export class FolderFieldHandler {
    static preCloudUpdate() {
        // Remove extra slashes from folder path
        storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');
    }
}

// html ids are automatic vairables
/* globals storageFolder */