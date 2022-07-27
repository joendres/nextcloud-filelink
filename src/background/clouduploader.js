export class CloudUploader {
    /**
     * 
     * @param {CloudAccount} account The Account to use for the upload
     * @param {string} uploadId The id of the upload, unique over all accounts
     * @param {string} fileName The name of the file w/o its path
     * @param {File} fileObject The local file as a File object
     * @returns {{url:string, aborted:boolean}}
     */
    static async uploadFile(account, uploadId, fileName, fileObject) {
        return { url, aborted, };
    }
}