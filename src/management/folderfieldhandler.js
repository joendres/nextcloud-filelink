/**
 * Handle the input fields in the folder_fields fieldset
 */
export class FolderFieldHandler {
    static preCloudUpdate() {
        const storageFolder = document.querySelector("#storageFolder");
        // Remove extra slashes from folder path
        storageFolder.value = "/" + storageFolder.value.split('/').filter(e => "" !== e).join('/');
    }
}
