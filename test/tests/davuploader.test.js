import { DavUploader } from "../../src/background/davuploader.js";
const expect = chai.expect;

describe.only("DavUploader", () => {
    /** @todo Add tests */
    describe('constructor', () => {
        it("sets the expected default properties", () => {
            const du = new DavUploader("server_url", "user", "password", "userid", "folder");
            expect(du).to.deep.equal({
                "serverurl": "server_url",
                "storageFolder": "folder",
                "davUrl": "remote.php/dav/files/userid",
                "freeSpace": -1,
                "davHeaders": {
                    "Authorization": "Basic dXNlcjpwYXNzd29yZA==",
                    "User-Agent": "Filelink for *cloud/0.0.1",
                    "Content-Type": "application/octet-stream"
                }
            });
        });
    });
    describe('uploadFile', () => {
        it("is not a static method");
        it("is an async method");
        it("gets the details of a cloud file of the same name");
        it("uploads the file if no cloud file exists");
        it("returns ok, if the cloudfile has the same mtime and size");
        it("moves the cloud file to a subdir if it is different");
        it("the subdir's name is the cloud file mtime as a timestamp");
        it("returns ok:false if moving fails");
        it("uploads the file after moving the old one");
    });
    describe('getRemoteFileInfo', () => {
        it("is not a static method");
        it("is an async method");
        it("gets the data by doDavCall");
        it("returns null if doDavCall is not ok");
        it("parses the XML response");
        it("returns null if the XML is malformed");
        it("returns mtime from parsed XML");
        it("returns size from parsed XML");
        /** @todo what to do if it is a folder? */
        /** @todo what to do if the mtime is missing or invalid */
        /** @todo what to do if the size is missing or invalid */
        /** @todo May if there is something strange there, return size:-1 and mtime:-1 so it will be moved? */
    });
    describe('moveFileToDir', () => {
        it("is not a static method");
        it("is an async method");
        it("Sets status MOVING");
        it("recursively creates the destination folder");
        it("moves the file");
        it("returns true if moving succeeded");
        it("returns false if moving failed");
    });
    describe('doUpload', () => {
        it("is not a static method");
        it("is an async method");
    });

    describe('recursivelyCreateFolder', () => {
        it("is not a static method");
        it("is an async method");
    });
    describe('findOrCreateFolder', () => {
        it("is not a static method");
        it("is an async method");
    });
    describe('setMtime', () => {
        it("is not a static method");
        it("is not an async method");
    });
    describe('doDavCall', () => {
        it("is not a static method");
        it("is an async method");
    });
    describe('xhrUpload', () => {
        it("is not a static method");
        it("is an async method");
    });
});
